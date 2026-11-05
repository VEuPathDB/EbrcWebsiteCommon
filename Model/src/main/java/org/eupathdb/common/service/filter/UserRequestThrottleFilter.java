package org.eupathdb.common.service.filter;

import java.io.IOException;

import javax.annotation.Priority;
import javax.inject.Inject;
import javax.inject.Provider;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;

import org.eupathdb.common.service.filter.catalina.RateLimitFilter;
import org.glassfish.grizzly.http.server.Request;

@Priority(30)
public class UserRequestThrottleFilter extends RateLimitFilter {

  @Context
  protected ServletContext _servletContext;

  @Inject
  protected Provider<HttpServletRequest> _servletRequest;

  @Inject
  protected Provider<Request> _grizzlyRequest;

  public void filter(ContainerRequestContext requestContext) throws IOException {

    RequestData request = ContextLookup.getRequest(_servletRequest.get(), _grizzlyRequest.get());
  }
}
