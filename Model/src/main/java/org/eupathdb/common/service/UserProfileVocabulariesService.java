package org.eupathdb.common.service;

import static org.gusdb.oauth2.client.OAuthClient.getSSLContext;
import static org.gusdb.oauth2.client.OAuthClient.readResponseBody;

import java.io.IOException;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.glassfish.jersey.client.ClientConfig;
import org.gusdb.oauth2.client.OAuthClient;
import org.gusdb.oauth2.client.ValidatedToken;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONException;

@Path("/")
public class UserProfileVocabulariesService extends AbstractWdkService {

  @GET
  @Path("user-profile-vocabularies")
  @Produces(MediaType.APPLICATION_JSON)
  public Response getVocabs() {
    return transferOAuthGetEndpointResponse("/assets/public/profile-vocabs.json", "profile vocabularies");
  }

  @GET
  @Path("subscription-groups")
  @Produces(MediaType.APPLICATION_JSON)
  public Response getGroups() {
    return transferOAuthGetEndpointResponse("/groups?filter=active_and_expired", "subscription groups");
  }

  @GET
  @Path("my-managed-groups")
  @Produces(MediaType.APPLICATION_JSON)
  public Response getGroupsByLead() {
    return transferOAuthGetEndpointResponse("/my-managed-groups", "groups managed by this user");
  }

  private Response transferOAuthGetEndpointResponse(String path, String endpointDescription) {

    String url = getWdkModel().getModelConfig().getOauthUrl() + path;
    ValidatedToken authToken = getRequestingUser().getAuthenticationToken();

    try (Response response = ClientBuilder.newBuilder()
          .withConfig(new ClientConfig())
          .sslContext(getSSLContext(getWdkModel().getModelConfig()))
          .build()
          .target(url)
          .request(MediaType.APPLICATION_JSON)
          .header(HttpHeaders.AUTHORIZATION, OAuthClient.getAuthorizationHeaderValue(authToken))
          .get()) {

      // check for successful processing
      if (response.getStatus() != 200) {
        String responseBody = !response.hasEntity() ? "<empty>" : readResponseBody(response);
        throw new RuntimeException("Failure to get " + endpointDescription + " from OAuth server.  GET " +
            url + " returned " + response.getStatus() + " with body: " + responseBody);
      }

      // these are small enough to do this for now; may need to stream in the future
      String json = readResponseBody(response);
      return Response.ok(json).build();
    }
    catch (JSONException | IOException e) {
      throw new RuntimeException("Unable to retrieve " + endpointDescription + " at " + url, e);
    }
  }
}
