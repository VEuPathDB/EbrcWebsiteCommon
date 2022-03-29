package org.eupathdb.common.service.testrunner;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;
import java.util.stream.Collectors;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONArray;

@Path("/site-tests")
public class TestRunnerService extends AbstractWdkService {

  private enum ResultType {
    java("java-unit", "java-unit-tests.out"),
    javascript("javascript-unit", "javascript-unit-tests.out"),
    api("service-api", "service-api-tests.out");
    //site("site-availability");

    private final String _urlSegment;
    private final String _fileName;

    private ResultType(String urlSegment, String fileName) {
      _urlSegment = urlSegment;
      _fileName = fileName;
    }

    public static Optional<ResultType> findByUrlSegment(String urlSegment) {
      for (ResultType rt : values()) {
        if (rt._urlSegment.equals(urlSegment)) return Optional.of(rt);
      }
      return Optional.empty();
    }

    public String getUrlSegment() {
      return _urlSegment;
    }

    public String getFileName() {
      return _fileName;
    }
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Response getTestTypes() {
    return Response.ok(
      new JSONArray(
        Arrays.stream(ResultType.values())
          .map(ResultType::getUrlSegment)
          .collect(Collectors.toList())
      ).toString()
    ).build();
  }

  @GET
  @Path("result/{result-type}")
  @Produces(MediaType.TEXT_PLAIN)
  public Response getResult(
      @PathParam("result-type") String resultTypeStr
  ) throws IOException {
    ResultType resultType = ResultType.findByUrlSegment(resultTypeStr)
        .orElseThrow(() -> new NotFoundException("Invalid result type."));
    // FIXME: get the file wherever it lands (TBD by Jenkins/Bob)
    String fileLocation = "???/" + resultType.getFileName();
    if (!new File(fileLocation).exists()) {
      throw new NotFoundException("This resource has not yet been generated.");
    }
    return Response.ok(getStreamingOutput(new FileInputStream(fileLocation))).build();
  }
}
