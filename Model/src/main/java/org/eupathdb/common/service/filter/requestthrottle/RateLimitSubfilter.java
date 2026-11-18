package org.eupathdb.common.service.filter.requestthrottle;

import java.time.Duration;

import org.eupathdb.common.service.filter.requestthrottle.UserRequestThrottleFilter.ThrottleSubfilter;
import org.eupathdb.common.service.filter.requestthrottle.UserRequestThrottleFilterConfig.RequestRateConfig;
import org.gusdb.wdk.service.filter.RequestLoggingFilter;

import io.github.bucket4j.Bucket;

public class RateLimitSubfilter implements ThrottleSubfilter {

  private final long _userId;
  private final RequestRateConfig _config;
  private final int _retryInterval;
  private final String _failMessageSuffix;

  private Bucket _bucket;

  public RateLimitSubfilter(long userId, RequestRateConfig config) {
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

    // bucket4j uses the Token Bucket algorithm for rate control:
    //   The bucket has static capacity, and we start the bucket
    //   full.  Each request takes one token from the bucket.
    //   Tokens are re-added at the given rate (refill) until the
    //   bucket is full (reaches capacity).  This ensures no more
    //   than the capacity tokens are used over the time it takes
    //   to refill the entire bucket.
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
