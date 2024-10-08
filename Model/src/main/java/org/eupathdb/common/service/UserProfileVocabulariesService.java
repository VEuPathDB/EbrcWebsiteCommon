package org.eupathdb.common.service;

import static org.gusdb.oauth2.client.OAuthClient.getSSLContext;
import static org.gusdb.oauth2.client.OAuthClient.readResponseBody;

import java.io.IOException;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.glassfish.jersey.client.ClientConfig;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONException;

@Path("/user-profile-vocabularies")
public class UserProfileVocabulariesService extends AbstractWdkService {

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Response getVocabs() {

    String vocabUrl = getWdkModel().getModelConfig().getOauthUrl() + "/assets/public/profile-vocabs.json";

    try (Response response = ClientBuilder.newBuilder()
          .withConfig(new ClientConfig())
          .sslContext(getSSLContext(getWdkModel().getModelConfig()))
          .build()
          .target(vocabUrl)
          .request(MediaType.APPLICATION_JSON)
          .get()) {

      // check for successful processing
      if (response.getStatus() != 200) {
        String responseBody = !response.hasEntity() ? "<empty>" : readResponseBody(response);
        throw new RuntimeException("Failure to get profile vocabularies from OAuth server.  GET " +
            vocabUrl + " returned " + response.getStatus() + " with body: " + responseBody);
      }

      String json = readResponseBody(response);
      return Response.ok(json).build();
    }
    catch (JSONException | IOException e) {
      throw new RuntimeException("Unable to retrieve profile vocabularies at " + vocabUrl, e);
    }
  }
}
