package org.eupathdb.common.service;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.gusdb.wdk.service.service.AbstractWdkService;

@Path("payment-form-context")
public class CyberSourceCaptureContextService extends AbstractWdkService {

  @GET
  @Produces(MediaType.TEXT_PLAIN)
  public Response getCaptureContext(
      @QueryParam("amount") String amount,               // required; must match the pattern above
      @QueryParam("currency") String currency,           // optional; defaults to USD
      @QueryParam("invoice_number") String invoiceNumber // optional; logged with reference number for traceability
  ) {
    String jwt = "";
    
    return Response.ok(jwt).build();
  }
}
