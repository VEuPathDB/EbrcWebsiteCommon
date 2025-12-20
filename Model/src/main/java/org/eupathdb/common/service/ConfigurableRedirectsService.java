package org.eupathdb.common.service;

import java.net.URI;
import java.net.URISyntaxException;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;

import org.gusdb.wdk.service.service.AbstractWdkService;

@Path("/")
public class ConfigurableRedirectsService extends AbstractWdkService {

  @GET
  @Path("invoice-form")
  public Response getQualtricsForm() {
    return getRedirectResponse("INVOICE_FORM_URL");
  }

  private Response getRedirectResponse(String urlModelPropertyName) {
    String url = getWdkModel().getProperties().get(urlModelPropertyName);
    if (url == null) {
      throw new RuntimeException("Could not find model property " + urlModelPropertyName);
    }
    try {
      return Response.seeOther(new URI(url)).build();
    }
    catch (URISyntaxException e) {
      throw new RuntimeException("Model property " + urlModelPropertyName + ", value " + url + ", is not a valid URL.");
    }
  }
}
