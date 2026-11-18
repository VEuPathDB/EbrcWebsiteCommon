package org.eupathdb.common.service.filter.requestthrottle;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import org.eupathdb.common.service.filter.requestthrottle.UserRequestThrottleFilterConfig.InFlightConfig;
import org.eupathdb.common.service.filter.requestthrottle.UserRequestThrottleFilter.ThrottleSubfilter;
import org.gusdb.wdk.service.filter.RequestLoggingFilter;

public class ConcurrentRequestSubfilter implements ThrottleSubfilter {

  private static final int JITTER_SECONDS_MAX = 4;

  private final long _userId;
  private final boolean _isDbHeavyFilter;
  private final InFlightConfig _config;

  private AtomicInteger _currentRequests = new AtomicInteger(0);
  private AtomicLong _lastRejectionTime = new AtomicLong(0);
  private AtomicInteger _lastRetryDuration = new AtomicInteger(0);

  public ConcurrentRequestSubfilter(long userId, boolean isDbHeavyFilter, InFlightConfig config) {
    _userId = userId;
    _isDbHeavyFilter = isDbHeavyFilter;
    _config = config;
  }

  @Override
  public int checkNewRequest() {

    if (_currentRequests.incrementAndGet() <= _config.maxConcurrent()) {
      // filter passed (this request still at or under max)
      return PASSES_FILTER;
    }
    else {
      // this request cannot be added; undo the increment above
      _currentRequests.decrementAndGet();
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
