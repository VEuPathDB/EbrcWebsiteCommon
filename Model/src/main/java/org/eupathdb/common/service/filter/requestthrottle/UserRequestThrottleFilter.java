package org.eupathdb.common.service.filter.requestthrottle;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import javax.annotation.Priority;
import javax.inject.Inject;
import javax.inject.Provider;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.eupathdb.common.service.filter.requestthrottle.RateLimiterConfig.InFlightConfig;
import org.eupathdb.common.service.filter.requestthrottle.jersey.FastRateLimiter;
import org.eupathdb.common.service.filter.requestthrottle.jersey.RateLimiter;
import org.glassfish.grizzly.http.server.Request;
import org.gusdb.fgputil.web.RequestData;
import org.gusdb.wdk.controller.ContextLookup;
import org.gusdb.wdk.model.Utilities;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.model.user.User;
import org.gusdb.wdk.service.filter.RequestLoggingFilter;

@Priority(250)
public class UserRequestThrottleFilter implements ContainerRequestFilter, ContainerResponseFilter {

  private static final String OBSERVATION_ONLY_MODEL_PROP_KEY = "REQUEST_THROTTLE_OBSERVATION_ONLY"; // default is true
  private static final String CONCURRENT_REQUEST_FILTERS_PROP_KEY = "concurrent_request_filters_list";

  /*------------ static rate limiter management  ---------------*/

  // constants
  private static final long GUEST_REQUESTS_ID = -1;
  private static final long TOTAL_REQUESTS_ID = -2;
  private static final int PASSES_FILTER = -1;
  
  // global config
  private static boolean OBSERVATION_ONLY;
  private static RateLimiterConfig CONFIG;

  private static class ConcurrentRequestFilter {

    private final long _userId;
    private final boolean _isDbHeavyFilter;
    private final InFlightConfig _config;

    private AtomicInteger _currentRequests = new AtomicInteger(0);
    private AtomicLong _lastRejectionTime = new AtomicLong(0);
    private AtomicInteger _lastRetryDuration = new AtomicInteger(0);

    public ConcurrentRequestFilter(long userId, boolean isDbHeavyFilter, InFlightConfig config) {
      _userId = userId;
      _isDbHeavyFilter = isDbHeavyFilter;
      _config = config;
    }

    public int checkNewRequest() {

      if (_currentRequests.get() > _config.maxConcurrent()) {

        // too many requests; log failure
        RequestLoggingFilter.LOG.info(new StringBuilder()
            .append("Request failed to pass filter [CONCURRENT_")
            .append(_isDbHeavyFilter ? "DB_HEAVY" : "ALL")
            .append("-")
            .append(getLogUserPortion(_userId))
            .append("], ")
            .append(_config.maxConcurrent())
            .append(" concurrent requests succeeded.")
            .toString());

        // check rejection time and update
        long currentTime = System.currentTimeMillis();
        long lastRejectionTime = _lastRejectionTime.getAndSet(currentTime);

        int retryDuration = _lastRetryDuration.updateAndGet(previous -> {
          // reset to min if never set or last rejection time longer ago than reset window
          if (previous == 0 || lastRejectionTime + (_config.retryAfter().resetWindow() * 1000) < currentTime)
            return _config.retryAfter().retryMin();
          previous *= 2;
          if (previous > _config.retryAfter().retryMax())
            previous = _config.retryAfter().retryMax();
          return previous;
        });

        return retryDuration;
      }

      // filter passed; add request
      _currentRequests.incrementAndGet();
      return PASSES_FILTER;
    }

    private static String getLogUserPortion(long userId) {
      if (userId == GUEST_REQUESTS_ID) return "GUEST";
      if (userId == TOTAL_REQUESTS_ID) return "TOTAL";
      return "USER_SPECIFIC(" + userId + ")";
    }

    public void completeRequest() {
      _currentRequests.decrementAndGet();
    }
  }

  // concurrent requests tracking
  private static Map<Long,ConcurrentRequestFilter> CONCURRENT_REQUESTS_REGISTERED = new ConcurrentHashMap<>();
  private static ConcurrentRequestFilter CONCURRENT_REQUESTS_GUESTS;
  private static ConcurrentRequestFilter CONCURRENT_REQUESTS_TOTAL;

  // DB-heavy concurrent requests tracking
  private static Map<Long,ConcurrentRequestFilter> CONCURRENT_REQUESTS_REGISTERED_DB = new ConcurrentHashMap<>();
  private static ConcurrentRequestFilter CONCURRENT_REQUESTS_GUESTS_DB;
  private static ConcurrentRequestFilter CONCURRENT_REQUESTS_TOTAL_DB;

  private static RateLimiter RATE_LIMITER;

  public static void initialize(WdkModel wdkModel) {
    try {
      String observationOnlyStr = wdkModel.getProperties().get(OBSERVATION_ONLY_MODEL_PROP_KEY);
      OBSERVATION_ONLY = observationOnlyStr == null || !observationOnlyStr.equalsIgnoreCase("FALSE");
      CONFIG = RateLimiterConfig.readConfig();
      CONCURRENT_REQUESTS_GUESTS = new ConcurrentRequestFilter(GUEST_REQUESTS_ID, false, CONFIG.getGuestUsersCombined().inFlightAll());
      CONCURRENT_REQUESTS_TOTAL = new ConcurrentRequestFilter(TOTAL_REQUESTS_ID, false, CONFIG.getGlobal().inFlightAll());
      CONCURRENT_REQUESTS_GUESTS_DB = new ConcurrentRequestFilter(GUEST_REQUESTS_ID, true, CONFIG.getGuestUsersCombined().inFlightDbHeavy());
      CONCURRENT_REQUESTS_TOTAL_DB = new ConcurrentRequestFilter(TOTAL_REQUESTS_ID, true, CONFIG.getGlobal().inFlightDbHeavy());
      
      RATE_LIMITER = new FastRateLimiter();
    }
    catch (IOException e) {
      throw new WdkRuntimeException("Could not initialize rate limiters.", e);
    }
  }

  public static void shutDown() {
    if (RATE_LIMITER != null)
      RATE_LIMITER.destroy();
  }

  /*------------ end static rate limiter management  ---------------*/

  @Context
  protected ServletContext _servletContext;

  @Inject
  protected Provider<HttpServletRequest> _servletRequest;

  @Inject
  protected Provider<Request> _grizzlyRequest;

  @Override
  public void filter(ContainerRequestContext requestContext) throws IOException {

    // gather information about this request
    RequestData request = ContextLookup.getRequest(_servletRequest.get(), _grizzlyRequest.get());
    User user = (User) request.getAttributeMap().get(Utilities.CONTEXT_KEY_USER_OBJECT);
    boolean isRegisteredUser = user != null && !user.isGuest();
    String requestPath = requestContext.getUriInfo().getPath();
    boolean isDbHeavyRequest = isDbHeavyRequest(requestPath);

    // gather concurrent request filters for this request
    List<ConcurrentRequestFilter> filtersToCheck = new ArrayList<>();

    // add filter for db-heavy requests by user
    if (isDbHeavyRequest) {
      filtersToCheck.add(isRegisteredUser
          ? CONCURRENT_REQUESTS_REGISTERED_DB.computeIfAbsent(user.getUserId(),
              id -> new ConcurrentRequestFilter(user.getUserId(), true, CONFIG.getRegisteredUsers().inFlightDbHeavy()))
          : CONCURRENT_REQUESTS_GUESTS_DB);
    }

    // add filter for all concurrent requests by user
    filtersToCheck.add(isRegisteredUser
        ? CONCURRENT_REQUESTS_REGISTERED.computeIfAbsent(user.getUserId(),
            id -> new ConcurrentRequestFilter(user.getUserId(), false, CONFIG.getRegisteredUsers().inFlightAll()))
        : CONCURRENT_REQUESTS_GUESTS);

    // add filter for total db-heavy concurrent requests (across users)
    filtersToCheck.add(CONCURRENT_REQUESTS_TOTAL_DB);

    // add filter for total concurrent requests (across users)
    filtersToCheck.add(CONCURRENT_REQUESTS_TOTAL);

    // check filters in order
    List<ConcurrentRequestFilter> filtersToClear = new ArrayList<>();
    for (ConcurrentRequestFilter filter : filtersToCheck) {
      // check this filter; if filter causes abort, return
      if (handlePossibleAbort(requestContext, filter.checkNewRequest())) {
        // set filters that passed (i.e. incremented) on request to be decremented
        requestContext.setProperty(CONCURRENT_REQUEST_FILTERS_PROP_KEY, filtersToClear);
        return;
      }
      else {
        // request passed this filter; add to decrement list
        filtersToClear.add(filter);
      }
    }

    // passed all concurrent request filters; set on request
    requestContext.setProperty(CONCURRENT_REQUEST_FILTERS_PROP_KEY, filtersToClear);

    // filter request rate
  }

  /**
   * @param requestContext request context to abort with
   * @param retrySecs calculated retry seconds or PASSES_FILTER
   * @return true if request is aborted, else false
   */
  private static boolean handlePossibleAbort(ContainerRequestContext requestContext, int retrySecs) {
    if (retrySecs != PASSES_FILTER && !OBSERVATION_ONLY) {
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
  public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)
      throws IOException {
    @SuppressWarnings("unchecked")
    List<ConcurrentRequestFilter> filtersToClear = (List<ConcurrentRequestFilter>)requestContext.getProperty(CONCURRENT_REQUEST_FILTERS_PROP_KEY);
    for (ConcurrentRequestFilter filter : filtersToClear) {
      filter.completeRequest();
    }
  }

}
