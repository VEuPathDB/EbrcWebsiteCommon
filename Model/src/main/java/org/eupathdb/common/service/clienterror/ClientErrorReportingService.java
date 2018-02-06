package org.eupathdb.common.service.clienterror;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.gusdb.fgputil.events.Events;
import org.gusdb.wdk.events.ErrorEvent;
import org.gusdb.wdk.service.filter.ClientCacheExpirationFilter;
import org.gusdb.wdk.service.request.exception.RequestMisformatException;
import org.gusdb.wdk.service.service.WdkService;
import org.json.JSONException;
import org.json.JSONObject;

@Path("/client-error")
public class ClientErrorReportingService extends WdkService {

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  public Response reportError(String body) throws RequestMisformatException {
    try {
      if (requestValid()) {
        Events.trigger(new ErrorEvent(new ClientError(new JSONObject(body)), getErrorContext()));
        return Response.noContent().build();
      }
      else {
        return Response.notAcceptable(null).build();
      }
    }
    catch (JSONException e) {
      throw new RequestMisformatException(e.getMessage());
    }
  }

  private boolean requestValid() {
    try {
      long wdkStartupTime = getWdkModel().getStartupTime();
      long sentTime = Long.parseLong(ClientCacheExpirationFilter.getClientTimestamp(getHeaders()));
      return wdkStartupTime == sentTime;
    }
    catch (NumberFormatException e) {
      // sent header is in the wrong format
      return false;
    }
  }
}
