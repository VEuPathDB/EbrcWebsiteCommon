package org.eupathdb.common.service;

import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.regex.Pattern;

import javax.ws.rs.GET;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.Timer;
import org.gusdb.wdk.service.service.AbstractWdkService;

@Path("/raw-files/{path:.+}")
public class RawFileDownloadService extends AbstractWdkService {

  private static final Logger LOG = Logger.getLogger(RawFileDownloadService.class);

  private static final Pattern ALLOWED_PATTERN = Pattern.compile("[a-zA-Z_0-9\\-\\./]+");

  @GET
  public Response downloadFile(@PathParam("path") String pathSuffix) {
    if (pathSuffix.contains("..") || !ALLOWED_PATTERN.matcher(pathSuffix).matches()) {
      throw new NotFoundException();
    }
    String pathPrefix = getWdkModel().getProperties().get("RAWFILESDOWNLOADDIR");
    java.nio.file.Path path = Paths.get(pathPrefix, getWdkModel().getProjectId(), pathSuffix);
    LOG.info("User requested download of raw file: " + path);
    if (!Files.isRegularFile(path) || !Files.isReadable(path)) {
      LOG.warn("Requested file matched regex and seemed value but was not found");
      throw new NotFoundException();
    }
    StreamingOutput streamer = out -> {
      Timer t = new Timer();
      try (FileInputStream in = new FileInputStream(path.toFile())) {
        long bytes = in.transferTo(out);
        LOG.info("File " + path + ", size " + bytes + " bytes, downloaded in " + t.getElapsedString());
      }
    };
    return Response
        .ok(streamer)
        .header("Content-Disposition", "attachment; filename=\"" + path.getFileName() + "\"")
        .build();
  }

}
