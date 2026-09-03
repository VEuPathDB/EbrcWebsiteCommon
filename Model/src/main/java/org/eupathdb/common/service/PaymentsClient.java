package org.eupathdb.common.service;

import static org.gusdb.fgputil.functional.Functions.wrapException;
import static org.gusdb.oauth2.client.OAuthClient.getSSLContext;
import static org.gusdb.oauth2.client.OAuthClient.readResponseBody;

import java.io.IOException;

import javax.net.ssl.SSLContext;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.glassfish.jersey.client.ClientConfig;
import org.gusdb.oauth2.client.OAuthClient;
import org.gusdb.oauth2.client.OAuthConfig;
import org.gusdb.wdk.model.config.ModelConfig;
import org.json.JSONException;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.json.JsonMapper;

public class PaymentsClient {

  private static final Logger LOG = Logger.getLogger(PaymentsClient.class);

  private final JsonMapper _mapper = JsonMapper.builder().build();

  private final OAuthConfig _oauthConfig;
  private final SSLContext _sslContext;

  @JsonInclude(JsonInclude.Include.NON_NULL)
  private class ClientCredentials {

    @JsonProperty(OAuthClient.JSON_KEY_CLIENT_ID)
    private final String _clientId;

    @JsonProperty(OAuthClient.JSON_KEY_CLIENT_SECRET)
    private final String _clientSecret;
 
    public ClientCredentials() {
      _clientId = _oauthConfig.getOauthClientId();
      _clientSecret = _oauthConfig.getOauthClientSecret();
    }
  }

  @JsonInclude(JsonInclude.Include.NON_NULL)
  private class AuthenticatedPayload {

    @JsonProperty(OAuthClient.JSON_KEY_CREDENTIALS)
    private final ClientCredentials _credentials;

    @JsonProperty("payment")
    private final Payment _payment;

    // used to request payment information (by ID or bulk)
    public AuthenticatedPayload() {
      this(null);
    }

    // used to send new payment object (row)
    public AuthenticatedPayload(Payment payment) {
      _credentials = new ClientCredentials();
      _payment = payment;
       
    }
  }
  
  public PaymentsClient(ModelConfig modelConfig) {
    _oauthConfig = modelConfig;
    _sslContext = getSSLContext(modelConfig);
  }

  public void insertPayment(Payment payment) {

    String url = _oauthConfig.getOauthUrl() + "/payments";
    String payload = wrapException(() -> _mapper.writeValueAsString(new AuthenticatedPayload(payment)));

    try (Response response = ClientBuilder.newBuilder()
          .withConfig(new ClientConfig())
          .sslContext(_sslContext)
          .build()
          .target(url)
          .request()
          .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON)
          .post(Entity.json(payload))) {

      // check for successful processing
      if (response.getStatus() != 200) {
        String responseBody = !response.hasEntity() ? "<empty>" : readResponseBody(response);
        String message = "Failure to persist payment information.  POST " +
            url + " returned " + response.getStatus() + " with body: " + responseBody;
        LOG.error(message);
        LOG.error("Logging request body to prevent information loss: " + payment.toJson());
        throw new RuntimeException(message);
      }
    }
    catch (JSONException | IOException e) {
      throw new RuntimeException("Failure to persist payment information. Logging " +
          "request body to prevent information loss: " + payment.toJson(), e);
    }
  }

  public Payment retrievePayment(String referenceNumber) {

    String url = _oauthConfig.getOauthUrl() + "/payments/" + referenceNumber;
    String payload = wrapException(() -> _mapper.writeValueAsString(new AuthenticatedPayload()));

    try (Response response = ClientBuilder.newBuilder()
        .withConfig(new ClientConfig())
        .sslContext(_sslContext)
        .build()
        .target(url)
        .request(MediaType.APPLICATION_JSON)
        .post(Entity.json(payload))) {

      // check for successful processing
      if (response.getStatus() != 200) {
        String responseBody = !response.hasEntity() ? "<empty>" : readResponseBody(response);
        throw new RuntimeException("Failure to fetch payment by ID.  GET " +
            url + " returned " + response.getStatus() + " with body: " + responseBody);
      }

      // these are small enough to do this for now; may need to stream in the future
      String json = readResponseBody(response);
      return _mapper.readValue(json, Payment.class);
    }
    catch (JSONException | IOException e) {
      throw new RuntimeException("Unable to fetch/parse payment information at " + url, e);
    }
  }
}
