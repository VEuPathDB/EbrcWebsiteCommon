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

import org.eupathdb.common.service.filter.requestthrottle.RateLimiterConfig.InFlightConfig;
import org.eupathdb.common.service.filter.requestthrottle.RateLimiterConfig.RequestRateConfig;
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

  private static final String OBSERVATION_ONLY_MODEL_PROP_KEY = "REQUEST_THROTTLE_OBSERVATION_ONLY"; // default is true
  private static final String THROTTLE_FILTERS_PROP_KEY = "concurrent_request_filters_list";

  private static final int JITTER_SECONDS_MAX = 4;

  /*------------ static rate limiter management  ---------------*/

  // constants
  private static final long GUEST_REQUESTS_ID = -1;
  private static final long TOTAL_REQUESTS_ID = -2;
  private static final int PASSES_FILTER = -1;
  
  // global config
  private static boolean OBSERVATION_ONLY;
  private static RateLimiterConfig CONFIG;

  private interface ThrottleSubfilter {
    public int checkNewRequest();
    public void completeRequest();
  }

  private static class ConcurrentRequestFilter implements ThrottleSubfilter {

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

    @Override
    public int checkNewRequest() {

      if (_currentRequests.get() <= _config.maxConcurrent()) {
        // filter passed; add request
        _currentRequests.incrementAndGet();
        return PASSES_FILTER;
      }

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

      if (_config.retryAfter().addJitter()) {
        retryDuration += ThreadLocalRandom.current().nextInt(JITTER_SECONDS_MAX + 1);
      }

      return retryDuration;

    }

    @Override
    public void completeRequest() {
      _currentRequests.decrementAndGet();
    }
  }

  private static class RateLimitFilter implements ThrottleSubfilter {

    private final long _userId;
    private final RequestRateConfig _config;
    private final int _retryInterval;
    private final String _failMessageSuffix;

    private Bucket _bucket;

    public RateLimitFilter(long userId, RequestRateConfig config) {
      _userId = userId;
      _config = config;
      double retry = config.retryAfter().bucketTimeMultiplier() * config.perTimeWindow() / config.numRequests();
      _retryInterval = Math.min(
          config.retryAfter().retryMax(),
          Double.valueOf(Math.floor(retry)).intValue()
      );
      _failMessageSuffix = new StringBuilder()
          .append("], ")
          .append("only ")
          .append(_config.numRequests())
          .append(" allowed over a ")
          .append(_config.perTimeWindow())
          .append(" second interval.")
          .toString();
      _bucket = Bucket.builder()
          .addLimit(limit -> limit
              .capacity(config.numRequests())
              .refillGreedy(config.numRequests(),
                  Duration.ofSeconds(config.perTimeWindow())))
          .build();
    }

    @Override
    public int checkNewRequest() {
      if (_bucket.tryConsume(1)) {
        // filter passed
        return PASSES_FILTER;
      }

      // too many requests; log failure
      RequestLoggingFilter.LOG.info(new StringBuilder()
          .append("Request failed to pass filter [RATELIMIT-")
          .append(getLogUserPortion(_userId))
          .append(_failMessageSuffix)
          .toString());

      return _retryInterval;
    }

    @Override
    public void completeRequest() {
      // nothing to do here
    }
  }


  static String getLogUserPortion(long userId) {
    if (userId == GUEST_REQUESTS_ID) return "GUEST";
    if (userId == TOTAL_REQUESTS_ID) return "TOTAL";
    return "USER_SPECIFIC(" + userId + ")";
  }

  // concurrent requests tracking
  private static Map<Long,ConcurrentRequestFilter> CONCURRENT_REQUESTS_REGISTERED = new ConcurrentHashMap<>();
  private static ConcurrentRequestFilter CONCURRENT_REQUESTS_GUESTS;
  private static ConcurrentRequestFilter CONCURRENT_REQUESTS_TOTAL;

  // DB-heavy concurrent requests tracking
  private static Map<Long,ConcurrentRequestFilter> CONCURRENT_REQUESTS_REGISTERED_DB = new ConcurrentHashMap<>();
  private static ConcurrentRequestFilter CONCURRENT_REQUESTS_GUESTS_DB;
  private static ConcurrentRequestFilter CONCURRENT_REQUESTS_TOTAL_DB;

  // rate limit tracking
  private static Map<Long,RateLimitFilter> RATE_LIMITER_REGISTERED = new ConcurrentHashMap<>();
  private static RateLimitFilter RATE_LIMITER_GUESTS;
  //private static RateLimitFilter RATE_LIMITER_TOTAL;

  public static void initialize(WdkModel wdkModel) {
    try {

      String observationOnlyStr = wdkModel.getProperties().get(OBSERVATION_ONLY_MODEL_PROP_KEY);
      OBSERVATION_ONLY = observationOnlyStr == null || !observationOnlyStr.equalsIgnoreCase("FALSE");
      CONFIG = RateLimiterConfig.readConfig();

      CONCURRENT_REQUESTS_GUESTS = new ConcurrentRequestFilter(GUEST_REQUESTS_ID, false, CONFIG.getGuestUsersCombined().inFlightAll());
      CONCURRENT_REQUESTS_TOTAL = new ConcurrentRequestFilter(TOTAL_REQUESTS_ID, false, CONFIG.getGlobal().inFlightAll());

      CONCURRENT_REQUESTS_GUESTS_DB = new ConcurrentRequestFilter(GUEST_REQUESTS_ID, true, CONFIG.getGuestUsersCombined().inFlightDbHeavy());
      CONCURRENT_REQUESTS_TOTAL_DB = new ConcurrentRequestFilter(TOTAL_REQUESTS_ID, true, CONFIG.getGlobal().inFlightDbHeavy());

      RATE_LIMITER_GUESTS = new RateLimitFilter(GUEST_REQUESTS_ID, CONFIG.getGuestUsersCombined().requestRate());
      //RATE_LIMITER_GUESTS = new RateLimitFilter(GUEST_REQUESTS_ID, CONFIG.getGlobal().requestRate());

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
    List<ThrottleSubfilter> filtersToCheck = new ArrayList<>();

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

    // add filter for by-user rate limiting
    filtersToCheck.add(isRegisteredUser
        ? RATE_LIMITER_REGISTERED.computeIfAbsent(user.getUserId(),
            id -> new RateLimitFilter(user.getUserId(), CONFIG.getRegisteredUsers().requestRate()))
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
    List<ConcurrentRequestFilter> filtersToClear = (List<ConcurrentRequestFilter>)requestContext.getProperty(THROTTLE_FILTERS_PROP_KEY);
    for (ConcurrentRequestFilter filter : filtersToClear) {
      filter.completeRequest();
    }
  }

  @Override
  protected void onRequestCompleteNoContent(RequestData request, ExtendedUriInfo uriInfo, WdkModel wdkModel,
      User user, int httpStatus) {
    // TODO Auto-generated method stub
    
  }

  @Override
  protected void performContentWrite(RequestData request, ExtendedUriInfo uriInfo, WdkModel wdkModel,
      User user, int httpStatus, WriterInterceptorContext writerContext) throws IOException {
    // TODO Auto-generated method stub
    
  }

}
