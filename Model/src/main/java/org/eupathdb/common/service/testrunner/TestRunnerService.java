package org.eupathdb.common.service.testrunner;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Map;

import javax.ws.rs.GET;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.gusdb.fgputil.runtime.GusHome;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.service.service.AbstractWdkService;

@Path("/site-tests")
public class TestRunnerService extends AbstractWdkService {

  private enum ResultType {
    java("java-unit"),
    javascript_unit("javascript-unit"),
    api("service-api"),
    selenium("site-availability");

    private final String _fileNamePrefix;

    private ResultType(String fileNamePrefix) {
      _fileNamePrefix = fileNamePrefix;
    }

    public String getFileNamePrefix() {
      return _fileNamePrefix;
    }
  }

  @GET
  @Path("run")
  @Produces(MediaType.TEXT_PLAIN)
  public Response runTests() throws IOException, InterruptedException {
    String gusHome = GusHome.getGusHome();
    WdkModel wdkModel = getWdkModel();
    String outputDirectory = gusHome + "/test/EbrcWebsiteCommon/Model/results";
    String workingDirectory = gusHome + "/test/EbrcWebsiteCommon/Model/working-dir";
    String[] command = new String[] {
        gusHome + "/bin/testRunner.sh",
        wdkModel.getProjectId(),
        wdkModel.getProperties().get("LOCALHOST"),
        outputDirectory,
        workingDirectory
    };
    ProcessBuilder builder = new ProcessBuilder()
        .command(command)
        .redirectOutput(new File(workingDirectory + "/testRunner.out"))
        .redirectError(new File(workingDirectory + "/testRunner.err"));
    Map<String,String> env = builder.environment();
    env.put("GUS_HOME", gusHome);
    env.put("PROJECT_HOME", gusHome + "/../project_home");
    Process process = builder.start();
    int exitCode = process.waitFor();
    return Response.ok(exitCode).build();
  }

  @GET
  @Path("result/{result-name}")
  @Produces(MediaType.TEXT_PLAIN)
  public Response runTests(@PathParam("result-name") ResultType resultType) throws IOException {
    String fileLocation = GusHome.getGusHome() + "/test/EbrcWebsiteCommon/Model/results/" + resultType.getFileNamePrefix() + "-tests.out";
    if (!new File(fileLocation).exists()) {
      throw new NotFoundException("This resource has not yet been generated.");
    }
    return Response.ok(getStreamingOutput(new FileInputStream(fileLocation))).build();
  }
}
