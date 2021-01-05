package org.eupathdb.common.service;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.gusdb.wdk.service.provider.ExceptionMapper;

/**
 * Handles special VEuPathDB runtime exceptions that we want to cause service
 * return codes of 400 even though they happen in places where all user input
 * should already be validated.
 * 
 * @author rdoherty
 */
public class EbrcExceptionMapper extends ExceptionMapper {

  @Override
  public Response toResponse(Exception e) {
    if (e instanceof PostValidationUserException) {
      return logResponse(e, Response.status(Status.BAD_REQUEST)
          .type(MediaType.TEXT_PLAIN).entity(createCompositeExceptionMessage(e)).build());
    }
    return super.toResponse(e);
  }
}
