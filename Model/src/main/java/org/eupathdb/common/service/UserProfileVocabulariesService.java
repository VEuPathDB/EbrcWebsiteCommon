package org.eupathdb.common.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.glassfish.jersey.client.ClientConfig;
import org.gusdb.oauth2.client.KeyStoreTrustManager.KeyStoreConfig;
import org.gusdb.oauth2.client.OAuthClient;
import org.gusdb.wdk.model.config.ModelConfig;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONException;

@Path("/user-profile-vocabularies")
public class UserProfileVocabulariesService extends AbstractWdkService {

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Response getVocabs() {

    ModelConfig config = getWdkModel().getModelConfig();
    String vocabUrl = getWdkModel().getModelConfig().getOauthUrl() + "/assets/public/profile-vocabs.json";

    try (Response response = ClientBuilder.newBuilder()
          .withConfig(new ClientConfig())
          .sslContext(createSslContext(config))
          .build()
          .target(vocabUrl)
          .request(MediaType.APPLICATION_JSON)
          .get()) {

      // check for successful processing
      if (response.getStatus() != 200) {
        String responseBody = !response.hasEntity() ? "<empty>" : readResponseBody(response);
        throw new RuntimeException("Failure to get JWKS information.  GET " + vocabUrl + " returned " + response.getStatus() + " with body: " + responseBody);
      }

      String json = readResponseBody(response);
      return Response.ok(json).build();
    }
    catch (KeyManagementException | NoSuchAlgorithmException | JSONException | IOException e) {
      throw new RuntimeException("Unable to retrieve profile vocabs at " + vocabUrl, e);
    }
  }

  private static String readResponseBody(Response response) throws IOException {
    InputStream entity = (InputStream)response.getEntity();
    ByteArrayOutputStream body = new ByteArrayOutputStream();
    entity.transferTo(body);
    return body.toString(StandardCharsets.UTF_8);
  }

  private static SSLContext createSslContext(KeyStoreConfig config) throws NoSuchAlgorithmException, KeyManagementException {
    TrustManager trustManager = OAuthClient.getTrustManager(config);
    SSLContext sslContext = SSLContext.getInstance("SSL");
    sslContext.init(null, new TrustManager[]{ trustManager }, null);
    return sslContext;
  }
}
