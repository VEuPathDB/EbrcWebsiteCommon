package org.eupathdb.common.service;

import org.gusdb.wdk.model.WdkRuntimeException;

import javax.ws.rs.*;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.gusdb.fgputil.json.JsonUtil.Jackson;

/**
 * Proxy/passthrough service to NCBI's PubMed APIs to work around CORS issues.
 */
@Path("pubmed/citation")
public class PubMedProxyService {
  // IMPORTANT!! The trailing slash included before query params is intentional
  // to avoid redirects from the NCBI API.
  private static final String API_URL = "https://pmc.ncbi.nlm.nih.gov/api/ctxp/v1/pubmed/";

  private static final String CITATION_API_SEGMENT = "format=citation";

  /**
   * Fetch citation strings by PMID.
   */
  @GET
  public Response getCitation(@QueryParam("pmid") Integer pmid) {
    if (pmid == null) {
      return Response.status(400)
        .type(MediaType.APPLICATION_JSON)
        .entity(Jackson.createObjectNode()
          .put("status", "bad-request")
          .put("message", "pmid query parameter must be provided")
          .toString())
        .build();
    }

    var citationUrl = String.format(
      "%s?%s&id=%d",
      API_URL,
      CITATION_API_SEGMENT,
      pmid
    );

    var passthroughHeaders = new String[] {
      HttpHeaders.CONTENT_TYPE,
      HttpHeaders.CONTENT_LENGTH,
      HttpHeaders.CONTENT_ENCODING,
    };

    try {
      var ncbiResponse = HttpClient.newHttpClient()
        .send(
          HttpRequest.newBuilder(URI.create(citationUrl)).build(),
          HttpResponse.BodyHandlers.ofInputStream()
        );

      var ncbiHeaders = ncbiResponse.headers();

      var outputResponse = Response
        .status(ncbiResponse.statusCode())
        .entity((StreamingOutput) output -> {
          try (var stream = ncbiResponse.body()) {
            stream.transferTo(output);
          }
        });

      for (var header : passthroughHeaders)
        outputResponse.header(header, ncbiHeaders.allValues(header));

      return outputResponse.build();
    } catch (Exception e) {
      throw new WdkRuntimeException("failed to fetch PubMed citation", e);
    }
  }
}
