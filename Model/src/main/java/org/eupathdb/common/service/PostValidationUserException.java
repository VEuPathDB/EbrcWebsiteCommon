package org.eupathdb.common.service;

import org.gusdb.wdk.model.WdkRuntimeException;

/**
 * This exception or a subclass of it should be thrown to indicate a user input
 * problem in an area of code which would not normally experience user input
 * problems.  WDK does not throw this exception, but the WDK service will catch
 * it and return a 4xx response code (instead of a 5xx code) to indicate that
 * the user could avoid this exception if they modify their request.
 * 
 * @author rdoherty
 */
public class PostValidationUserException extends WdkRuntimeException {

  public PostValidationUserException(String message) {
    super(message);
  }

}
