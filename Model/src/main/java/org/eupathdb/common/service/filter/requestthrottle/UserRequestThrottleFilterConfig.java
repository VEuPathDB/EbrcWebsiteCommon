package org.eupathdb.common.service.filter.requestthrottle;

import java.io.IOException;
import java.io.InputStream;

import com.fasterxml.jackson.databind.json.JsonMapper;

public class UserRequestThrottleFilterConfig {

  private static final String CONFIG_RESOURCE_NAME = "org/eupathdb/common/service/filter/requestthrottle/rateLimiterConfig.json";

  public static UserRequestThrottleFilterConfig readConfig() throws IOException {
    try (InputStream configStream = UserRequestThrottleFilterConfig.class.getClassLoader().getResourceAsStream(CONFIG_RESOURCE_NAME)) {
      return JsonMapper.builder().build()
          .readValue(configStream.readAllBytes(), UserRequestThrottleFilterConfig.class);
    }
  }

  public record InFlightRetryAfter(
      int retryMin,
      int retryMax,
      int resetWindow,
      boolean addJitter
  ){}

  public record InFlightConfig(
      int maxConcurrent,
      InFlightRetryAfter retryAfter
  ){}

  public record RequestRateRetryAfter(
      double bucketTimeMultiplier,
      int retryMax
  ){}

  public record RequestRateConfig(
      int numRequests,
      int perTimeWindow,
      RequestRateRetryAfter retryAfter
  ){}

  public record GlobalConfig(
      InFlightConfig inFlightAll,
      InFlightConfig inFlightDbHeavy
  ){}

  public record UserConfig(
      InFlightConfig inFlightAll,
      InFlightConfig inFlightDbHeavy,
      RequestRateConfig requestRate
  ){}

  private UserConfig _registeredUsers;
  private UserConfig _guestUsersCombined;
  private GlobalConfig _global;

  public UserConfig getRegisteredUsers() {
    return _registeredUsers;
  }

  public void setRegisteredUsers(UserConfig registeredUsers) {
    _registeredUsers = registeredUsers;
  }

  public UserConfig getGuestUsersCombined() {
    return _guestUsersCombined;
  }

  public void setGuestUsersCombined(UserConfig guestUsersCombined) {
    _guestUsersCombined = guestUsersCombined;
  }

  public GlobalConfig getGlobal() {
    return _global;
  }

  public void setGlobal(GlobalConfig global) {
    _global = global;
  }

}
