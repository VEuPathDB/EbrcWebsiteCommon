package org.eupathdb.common.service.filter;

import java.io.IOException;

import javax.annotation.Priority;
import javax.inject.Inject;
import javax.inject.Provider;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.core.Context;

import org.eupathdb.common.service.filter.jersey.FastRateLimiter;
import org.eupathdb.common.service.filter.jersey.RateLimiter;
import org.glassfish.grizzly.http.server.Request;
import org.gusdb.fgputil.web.RequestData;
import org.gusdb.wdk.controller.ContextLookup;

@Priority(250)
public class UserRequestThrottleFilter implements ContainerRequestFilter {

  /*------------ static rate limiter management  ---------------*/

  private static RateLimiter RATE_LIMITER;

  public static void initialize() {
    RATE_LIMITER = new FastRateLimiter();
    RATE_LIMITER.set
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

    RequestData request = ContextLookup.getRequest(_servletRequest.get(), _grizzlyRequest.get());
    
    
  }
}
