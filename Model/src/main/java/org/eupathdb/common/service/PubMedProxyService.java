package org.eupathdb.common.service;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.service.service.AbstractWdkService;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.ByteArrayOutputStream;

import static org.gusdb.fgputil.json.JsonUtil.Jackson;

/**
 * Proxy/passthrough service to NCBI's PubMed APIs to work around CORS issues.
 */
@Path("pubmed")
public class PubMedProxyService extends AbstractWdkService {
  private static final String EUTILS_API_KEY_PROP = "NCBI_EUTILS_API_KEY";

  private static final String CITATION_BY_ID_SCRIPT = "pubmedIdToCitation";

  private final Logger logger = LogManager.getLogger(getClass());

  /**
   * Fetch citation strings by PMID.
   */
  @GET
  @Path("citation")
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

    var apiKey = getWdkModel()
      .getProperties()
      .get(EUTILS_API_KEY_PROP);

    if (apiKey == null) {
      throw new WdkRuntimeException("required model prop " + EUTILS_API_KEY_PROP + " is not set");
    }

    try {
      var command = "%s/bin/%s"
        .formatted(getWdkModel().getGusHome(), CITATION_BY_ID_SCRIPT);

      var buffer = new ByteArrayOutputStream(2048);

      var process = new ProcessBuilder(command, pmid.toString(), apiKey)
        .start();

      process.getInputStream().transferTo(buffer);
      process.getErrorStream().transferTo(buffer);

      if (process.waitFor() != 0) {
        logger.error(
          "script execution failed: {} {} prop({}) ----\n{}\n----",
          command,
          pmid,
          EUTILS_API_KEY_PROP,
          buffer.toString()
        );
        throw new WdkRuntimeException(CITATION_BY_ID_SCRIPT + " execution failed");
      }

      return Response.ok(buffer.toString(), MediaType.TEXT_PLAIN).build();
    } catch (Exception e) {
      if (e instanceof WdkRuntimeException typedError)
        throw typedError;
      else
        throw new WdkRuntimeException(e);
    }
  }
}
