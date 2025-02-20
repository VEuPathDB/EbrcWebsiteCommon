package org.eupathdb.common.model;

import static org.gusdb.fgputil.FormatUtil.NL;

import java.util.Map;
import java.util.function.Function;

import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.Tuples.TwoTuple;
import org.gusdb.fgputil.client.ClientUtil;
import org.gusdb.fgputil.client.CloseableResponse;
import org.gusdb.fgputil.events.Events;
import org.gusdb.wdk.errors.ServerErrorBundle;
import org.gusdb.wdk.events.ErrorEvent;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.user.User;
import org.gusdb.wdk.service.service.SessionService;
import org.gusdb.wsf.plugin.Plugin;
import org.json.JSONObject;

public class MultiBlastServiceUtil {

  private static final Logger LOG = Logger.getLogger(MultiBlastServiceUtil.class);

  // required properties in model.prop
  private static final String LOCALHOST_PROP_KEY = "LOCALHOST";
  private static final String SERVICE_URL_PROP_KEY = "MULTI_BLAST_SERVICE_URL";

  public static <T extends Exception> String getMultiBlastServiceUrl(WdkModel model, Function<String,T> exceptionProvider) throws T {
    Map<String,String> modelProps = model.getProperties();
    String localhost = modelProps.get(LOCALHOST_PROP_KEY);
    String multiBlastServiceUrl = modelProps.get(SERVICE_URL_PROP_KEY);
    if (localhost == null || multiBlastServiceUrl == null) {
      throw exceptionProvider.apply("model.prop must contain the properties: " +
          LOCALHOST_PROP_KEY + ", " + SERVICE_URL_PROP_KEY);
    }
    return localhost + multiBlastServiceUrl;
  }

  /**
   * Transfers multi-blast jobs from the guest user to the newly signed-in user
   * by calling the link-guest endpoint on the configured multi-blast service.
   *
   * @param oldUser guest user
   * @param newUser registered user
   * @param wdkModel model
   * @throws WdkModelException if no mblast service is configured (error calling service is not fatal)
   */
  public static void transferMultiBlastJobs(User oldUser, User newUser, WdkModel wdkModel, SessionService sessionSvc)
      throws WdkModelException {

    // get multi-blast URL from the model; this is a fatal operation, even though the actual merge is not
    String mblastServiceUrl = MultiBlastServiceUtil.getMultiBlastServiceUrl(wdkModel, WdkModelException::new);
    String jobMergerUrl = mblastServiceUrl + "/link-guest";

    // request body to merge guest's jobs to newly logged in user
    String body = new JSONObject()
      .put("guestID", oldUser.getUserId())
      .toString();

    // auth header for new user
    TwoTuple<String,String> authHeader = Plugin.getServiceAuthorizationHeader(newUser.getAuthenticationToken().getTokenValue());

    LOG.debug("Making request to copy mblast jobs:" + NL +
      "POST to " + jobMergerUrl + NL +
      "Header: " + authHeader.getKey() + ":" + authHeader.getValue() + NL +
      "Body: " + body);

    // make request and check result
    try (CloseableResponse response = new CloseableResponse(
      ClientBuilder.newClient()
        .target(jobMergerUrl)
        .request("*/*")
        .header(authHeader.getKey(), authHeader.getValue())
        .post(Entity.entity(body, MediaType.APPLICATION_JSON)))) {

      // this is a non-fatal error (should not keep user from logging in), but make every effort to alert QA
      if (!response.getStatusInfo().getFamily().equals(Response.Status.Family.SUCCESSFUL)) {
        String error = ClientUtil.readSmallResponseBody(response);
        handleMultiBlastException(new WdkModelException(
          "Unable to merge multi-blast jobs from guest user " +
            oldUser.getUserId() + " to registered user " + newUser.getUserId() +
            ". Service at " + jobMergerUrl + " returned " + response.getStatus() +
            " with error: " + error), sessionSvc);
      }
    }
    catch (Exception e) {
      handleMultiBlastException(e, sessionSvc);
    }
  }

  private static void handleMultiBlastException(Exception e, SessionService sessionSvc) {
    LOG.error("Multi-blast merge jobs request failed", e);
    Events.trigger(new ErrorEvent(
      new ServerErrorBundle(e),
      sessionSvc.getErrorContext()));
  }
}
