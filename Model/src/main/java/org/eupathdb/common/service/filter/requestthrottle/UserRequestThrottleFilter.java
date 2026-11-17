package org.eupathdb.common.service.filter.requestthrottle;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import javax.annotation.Priority;
import javax.servlet.ServletContext;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.WriterInterceptorContext;

import org.eupathdb.common.service.filter.requestthrottle.UserRequestThrottleFilterConfig.InFlightConfig;
import org.eupathdb.common.service.filter.requestthrottle.UserRequestThrottleFilterConfig.RequestRateConfig;
import org.glassfish.jersey.server.ExtendedUriInfo;
import org.gusdb.fgputil.web.RequestData;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.model.user.User;
import org.gusdb.wdk.service.filter.AbstractBookendFilter;
import org.gusdb.wdk.service.filter.RequestLoggingFilter;

import io.github.bucket4j.Bucket;

@Priority(250)
public class UserRequestThrottleFilter extends AbstractBookendFilter {

  // property keys
  private static final String OBSERVATION_ONLY_MODEL_PROP_KEY = "REQUEST_THROTTLE_OBSERVATION_ONLY"; // default is true
  private static final String THROTTLE_FILTERS_PROP_KEY = "concurrent_request_filters_list";

  // constants
  private static final long GUEST_REQUESTS_ID = -1;
  private static final long TOTAL_REQUESTS_ID = -2;
  
  // global config
  private static boolean OBSERVATION_ONLY;
  private static UserRequestThrottleFilterConfig CONFIG;

  public interface ThrottleSubfilter {

    public static final int PASSES_FILTER = -1;

    public int checkNewRequest();
    public void completeRequest();

    default String getLogUserPortion(long userId) {
      if (userId == GUEST_REQUESTS_ID) return "GUEST";
      if (userId == TOTAL_REQUESTS_ID) return "TOTAL";
      return "USER_SPECIFIC(" + userId + ")";
    }
  }

  private static class ThrottleSubfilterList extends ArrayList<ThrottleSubfilter> {}

  // concurrent requests tracking
  private static Map<Long,ConcurrentRequestSubfilter> CONCURRENT_REQUESTS_REGISTERED = new ConcurrentHashMap<>();
  private static ConcurrentRequestSubfilter CONCURRENT_REQUESTS_GUESTS;
  private static ConcurrentRequestSubfilter CONCURRENT_REQUESTS_TOTAL;

  // DB-heavy concurrent requests tracking
  private static Map<Long,ConcurrentRequestSubfilter> CONCURRENT_REQUESTS_REGISTERED_DB = new ConcurrentHashMap<>();
  private static ConcurrentRequestSubfilter CONCURRENT_REQUESTS_GUESTS_DB;
  private static ConcurrentRequestSubfilter CONCURRENT_REQUESTS_TOTAL_DB;

  // rate limit tracking
  private static Map<Long,RateLimitSubfilter> RATE_LIMITER_REGISTERED = new ConcurrentHashMap<>();
  private static RateLimitSubfilter RATE_LIMITER_GUESTS;
  //private static RateLimitSubfilter RATE_LIMITER_TOTAL;

  public static void initialize(WdkModel wdkModel) {
    try {

      String observationOnlyStr = wdkModel.getProperties().get(OBSERVATION_ONLY_MODEL_PROP_KEY);
      OBSERVATION_ONLY = observationOnlyStr == null || !observationOnlyStr.equalsIgnoreCase("FALSE");
      CONFIG = UserRequestThrottleFilterConfig.readConfig();

      CONCURRENT_REQUESTS_GUESTS = new ConcurrentRequestSubfilter(GUEST_REQUESTS_ID, false, CONFIG.getGuestUsersCombined().inFlightAll());
      CONCURRENT_REQUESTS_TOTAL = new ConcurrentRequestSubfilter(TOTAL_REQUESTS_ID, false, CONFIG.getGlobal().inFlightAll());

      CONCURRENT_REQUESTS_GUESTS_DB = new ConcurrentRequestSubfilter(GUEST_REQUESTS_ID, true, CONFIG.getGuestUsersCombined().inFlightDbHeavy());
      CONCURRENT_REQUESTS_TOTAL_DB = new ConcurrentRequestSubfilter(TOTAL_REQUESTS_ID, true, CONFIG.getGlobal().inFlightDbHeavy());

      RATE_LIMITER_GUESTS = new RateLimitSubfilter(GUEST_REQUESTS_ID, CONFIG.getGuestUsersCombined().requestRate());
      //RATE_LIMITER_GUESTS = new RateLimitSubfilter(GUEST_REQUESTS_ID, CONFIG.getGlobal().requestRate());

    }
    catch (IOException e) {
      throw new WdkRuntimeException("Could not initialize rate limiters.", e);
    }
  }

  /*------------ end static rate limiter management  ---------------*/

  @Context
  protected ServletContext _servletContext;

  @Override
  protected void onRequestBegin(RequestData request, ExtendedUriInfo uriInfo, WdkModel wdkModel, User user,
      ContainerRequestContext requestContext) throws IOException {

    // gather information about this request
    boolean isRegisteredUser = user != null && !user.isGuest();
    String requestPath = requestContext.getUriInfo().getPath();
    boolean isDbHeavyRequest = isDbHeavyRequest(requestPath);

    // gather concurrent request filters for this request
    ThrottleSubfilterList filtersToCheck = new ThrottleSubfilterList();

    // add filter for db-heavy requests by user
    if (isDbHeavyRequest) {
      filtersToCheck.add(isRegisteredUser
          ? CONCURRENT_REQUESTS_REGISTERED_DB.computeIfAbsent(user.getUserId(),
              id -> new ConcurrentRequestSubfilter(user.getUserId(), true, CONFIG.getRegisteredUsers().inFlightDbHeavy()))
          : CONCURRENT_REQUESTS_GUESTS_DB);
    }

    // add filter for all concurrent requests by user
    filtersToCheck.add(isRegisteredUser
        ? CONCURRENT_REQUESTS_REGISTERED.computeIfAbsent(user.getUserId(),
            id -> new ConcurrentRequestSubfilter(user.getUserId(), false, CONFIG.getRegisteredUsers().inFlightAll()))
        : CONCURRENT_REQUESTS_GUESTS);

    // add filter for total db-heavy concurrent requests (across users)
    filtersToCheck.add(CONCURRENT_REQUESTS_TOTAL_DB);

    // add filter for total concurrent requests (across users)
    filtersToCheck.add(CONCURRENT_REQUESTS_TOTAL);

    // add filter for by-user rate limiting
    filtersToCheck.add(isRegisteredUser
        ? RATE_LIMITER_REGISTERED.computeIfAbsent(user.getUserId(),
            id -> new RateLimitSubfilter(user.getUserId(), CONFIG.getRegisteredUsers().requestRate()))
        : RATE_LIMITER_GUESTS);
    
    // check filters in order
    List<ThrottleSubfilter> filtersToClear = new ArrayList<>();
    for (ThrottleSubfilter filter : filtersToCheck) {
      // check this filter; if filter causes abort, return
      if (handlePossibleAbort(requestContext, filter.checkNewRequest())) {
        // set filters that passed (i.e. incremented) on request to be decremented
        requestContext.setProperty(THROTTLE_FILTERS_PROP_KEY, filtersToClear);
        return;
      }
      else {
        // request passed this filter; add to decrement list
        filtersToClear.add(filter);
      }
    }

    // passed all concurrent request filters; set on request
    requestContext.setProperty(THROTTLE_FILTERS_PROP_KEY, filtersToClear);
  }

  /**
   * @param requestContext request context to abort with
   * @param retrySecs calculated retry seconds or PASSES_FILTER
   * @return true if request is aborted, else false
   */
  private static boolean handlePossibleAbort(ContainerRequestContext requestContext, int retrySecs) {
    if (retrySecs != ThrottleSubfilter.PASSES_FILTER && !OBSERVATION_ONLY) {
      requestContext.abortWith(Response
          .status(Status.TOO_MANY_REQUESTS)
          .header(HttpHeaders.RETRY_AFTER, retrySecs)
          .build());
      return true;
    }
    return false;
  }

  private static boolean isDbHeavyRequest(String requestPath) {
    // TODO: implement
    return false;
  }

  @Override
  protected void onRequestCompleteNoContent(RequestData request, ExtendedUriInfo uriInfo, WdkModel wdkModel,
      User user, int httpStatus) {
    clearRequestFromFilters(request);
  }

  @Override
  protected void performContentWrite(RequestData request, ExtendedUriInfo uriInfo, WdkModel wdkModel,
      User user, int httpStatus, WriterInterceptorContext writerContext) throws IOException {
    writerContext.proceed();
    clearRequestFromFilters(request);
  }

  private void clearRequestFromFilters(RequestData request) {
    for (ThrottleSubfilter filter : getAndRemoveProp(request, THROTTLE_FILTERS_PROP_KEY, ThrottleSubfilterList.class)) {
      filter.completeRequest();
    }
  }
}
