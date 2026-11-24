package org.eupathdb.common.service.filter.requestthrottle;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.annotation.Priority;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.WriterInterceptorContext;

import org.apache.log4j.Logger;
import org.glassfish.jersey.server.ExtendedUriInfo;
import org.gusdb.fgputil.functional.Either;
import org.gusdb.fgputil.web.HttpMethod;
import org.gusdb.fgputil.web.RequestData;
import org.gusdb.oauth2.client.ValidatedToken;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.model.user.User;
import org.gusdb.wdk.service.BearerTokens;
import org.gusdb.wdk.service.BearerTokens.Unauthenticated;
import org.gusdb.wdk.service.filter.AbstractBookendFilter;

@Priority(250)
public class UserRequestThrottleFilter extends AbstractBookendFilter {

  private static final Logger LOG = Logger.getLogger(UserRequestThrottleFilter.class);

  // property keys
  private static final String THROTTLE_ENABLED_MODEL_PROP_KEY = "REQUEST_THROTTLE_ENABLED"; // default is false
  private static final String THROTTLE_FILTERS_PROP_KEY = "concurrent_request_filters_list";

  // constants
  private static final long GUEST_REQUESTS_ID = -1;
  private static final long TOTAL_REQUESTS_ID = -2;

  // special paths
  private static final List<String> PATHS_TO_SKIP = List.of(
      "/system/metrics/prometheus",
      "/metrics/count-page-view/{clientPath:.+}",
      "/client-errors"
  );
  private static final List<String> DB_HEAVY_GET_PATHS = List.of(
      // test endpoints
      "/sleep/db-g",
      "/sleep/db-r"
  );
  private static final List<String> DB_HEAVY_POST_PATHS = List.of(
  );

  // global config
  private static boolean ENABLED;
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

      String enabledStr = wdkModel.getProperties().get(THROTTLE_ENABLED_MODEL_PROP_KEY);
      ENABLED = enabledStr != null && enabledStr.equalsIgnoreCase("TRUE"); // default false
      CONFIG = UserRequestThrottleFilterConfig.readConfig();

      CONCURRENT_REQUESTS_GUESTS = new ConcurrentRequestSubfilter(GUEST_REQUESTS_ID, false, CONFIG.getGuestUsersCombined().inFlightAll());
      CONCURRENT_REQUESTS_TOTAL = new ConcurrentRequestSubfilter(TOTAL_REQUESTS_ID, false, CONFIG.getGlobal().inFlightAll());

      CONCURRENT_REQUESTS_GUESTS_DB = new ConcurrentRequestSubfilter(GUEST_REQUESTS_ID, true, CONFIG.getGuestUsersCombined().inFlightDbHeavy());
      CONCURRENT_REQUESTS_TOTAL_DB = new ConcurrentRequestSubfilter(TOTAL_REQUESTS_ID, true, CONFIG.getGlobal().inFlightDbHeavy());

      RATE_LIMITER_GUESTS = new RateLimitSubfilter(GUEST_REQUESTS_ID, CONFIG.getGuestUsersCombined().requestRate());
      //RATE_LIMITER_TOTAL = new RateLimitSubfilter(GUEST_REQUESTS_ID, CONFIG.getGlobal().requestRate());

      LOG.info(UserRequestThrottleFilter.class.getName() + " successfully configured (enabled = " + ENABLED + ").");
    }
    catch (IOException e) {
      throw new WdkRuntimeException("Could not initialize rate limiters.", e);
    }
  }

  @Override
  protected void onRequestBegin(RequestData request, ExtendedUriInfo uriInfo, WdkModel wdkModel, User user,
      ContainerRequestContext requestContext) throws IOException {

    // gather information about this request
    String matchedPath = getPathTemplate(uriInfo);

    // since this filter runs before CheckLoginFilter (which will assign a guest if necessary), only
    //   inspect the bearer token to determine if one is passed and if its user is a guest
    String rawToken = BearerTokens.findRawBearerToken(request, requestContext);
    Either<ValidatedToken,Unauthenticated> bearerTokenStatus = BearerTokens.getBearerTokenStatus(rawToken, wdkModel);
    boolean isRegisteredUser = bearerTokenStatus.isLeft() && !bearerTokenStatus.getLeft().isGuest();
    long userId = isRegisteredUser ? Long.valueOf(bearerTokenStatus.getLeft().getUserId()) : GUEST_REQUESTS_ID;

    if (isSkippedRequest(request.getMethod(), matchedPath)) {
      // skip filter for certain method/path combos
      return;
    }

    // gather concurrent request filters for this request
    ThrottleSubfilterList filtersToCheck = new ThrottleSubfilterList();

    if (isDbHeavyRequest(request.getMethod(), matchedPath)) {

      // add filter for db-heavy requests by user
      filtersToCheck.add(isRegisteredUser
          ? CONCURRENT_REQUESTS_REGISTERED_DB.computeIfAbsent(userId,
              id -> new ConcurrentRequestSubfilter(id, true, CONFIG.getRegisteredUsers().inFlightDbHeavy()))
          : CONCURRENT_REQUESTS_GUESTS_DB);

      // add filter for total db-heavy concurrent requests (across users)
      filtersToCheck.add(CONCURRENT_REQUESTS_TOTAL_DB);
    }

    // add filter for all concurrent requests by user
    filtersToCheck.add(isRegisteredUser
        ? CONCURRENT_REQUESTS_REGISTERED.computeIfAbsent(userId,
            id -> new ConcurrentRequestSubfilter(id, false, CONFIG.getRegisteredUsers().inFlightAll()))
        : CONCURRENT_REQUESTS_GUESTS);

    // add filter for total concurrent requests (across users)
    filtersToCheck.add(CONCURRENT_REQUESTS_TOTAL);

    // add filter for by-user rate limiting
    filtersToCheck.add(isRegisteredUser
        ? RATE_LIMITER_REGISTERED.computeIfAbsent(userId,
            id -> new RateLimitSubfilter(id, CONFIG.getRegisteredUsers().requestRate()))
        : RATE_LIMITER_GUESTS);

    // add filter for global rate limiting
    //filtersToCheck.add(RATE_LIMITER_TOTAL);

    // check filters in order
    ThrottleSubfilterList filtersToClear = new ThrottleSubfilterList();
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

    // passed all filters; set on request
    requestContext.setProperty(THROTTLE_FILTERS_PROP_KEY, filtersToClear);

    LOG.info("Request to " + matchedPath + " from " + (isRegisteredUser ? "registered_user(" + userId + ")" : "guest") + " passed throttling filters and will be processed.");
  }

  /**
   * @param requestContext request context to abort with
   * @param retrySecs calculated retry seconds or PASSES_FILTER
   * @return true if request is aborted, else false
   */
  private static boolean handlePossibleAbort(ContainerRequestContext requestContext, int retrySecs) {
    if (retrySecs != ThrottleSubfilter.PASSES_FILTER) {
      // request did not pass filter
      if (ENABLED) {
        requestContext.abortWith(Response
            .status(Status.TOO_MANY_REQUESTS)
            .header(HttpHeaders.RETRY_AFTER, retrySecs)
            .build());
      }
      return true;
    }
    return false;
  }

  private static boolean isSkippedRequest(HttpMethod method, String matchedPath) {
    return PATHS_TO_SKIP.contains(matchedPath);
  }

  private static boolean isDbHeavyRequest(HttpMethod method, String matchedPath) {
    switch(method) {
      case GET:
        return DB_HEAVY_GET_PATHS.contains(matchedPath);
      case POST:
        return DB_HEAVY_POST_PATHS.contains(matchedPath);
      default:
        return false;
    }
  }

  @Override
  protected void onRequestCompleteNoContent(RequestData request, ExtendedUriInfo uriInfo, WdkModel wdkModel,
      User user, int httpStatus) {
    clearRequestFromFilters(request);
  }

  @Override
  protected void performContentWrite(RequestData request, ExtendedUriInfo uriInfo, WdkModel wdkModel,
      User user, int httpStatus, WriterInterceptorContext writerContext) throws IOException {
    try {
      writerContext.proceed();
    }
    finally {
      // clear request even if writing fails
      clearRequestFromFilters(request);
    }
  }

  private void clearRequestFromFilters(RequestData request) {
    ThrottleSubfilterList filters = getAndRemoveProp(request, THROTTLE_FILTERS_PROP_KEY, ThrottleSubfilterList.class);
    if (filters != null) { // happens if request aborts before hitting this filter
      for (ThrottleSubfilter filter : filters) {
        filter.completeRequest();
      }
    }
  }
}
