package org.eupathdb.common.service;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import javax.ws.rs.GET;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
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
    if (!Files.exists(path) || !Files.isReadable(path)) {
      LOG.warn("Requested file matched regex and seemed valid but was not found: " + path.toAbsolutePath());
      throw new NotFoundException();
    }
    if (Files.isRegularFile(path)) {
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
    else if (Files.isDirectory(path)) {
      StreamingOutput streamer = stream -> {
        Timer t = new Timer();
        try (ZipOutputStream out = new ZipOutputStream(new BufferedOutputStream(stream))) {
          Files.walkFileTree(path, new ZipOutputAppender(out));
        }
        LOG.info("Zipped contents of " + path + " downloaded in " + t.getElapsedString());
      };
      return Response
          .ok(streamer)
          .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + path.getFileName() + ".zip\"")
          .header(HttpHeaders.CONTENT_TYPE, "application/zip")
          .build();
    }
    else {
      LOG.warn("User requested raw file '" + path + "', not a file or directory.");
      return Response.status(Status.NOT_FOUND).build();
    }
  }

  /**
   * Writes all files and directories visited to the zip output stream
   */
  private static class ZipOutputAppender extends SimpleFileVisitor<java.nio.file.Path>{

    private final ZipOutputStream _out;

    public ZipOutputAppender(ZipOutputStream out) {
      _out = out;
    }

    @Override
    public FileVisitResult preVisitDirectory(java.nio.file.Path dir, BasicFileAttributes attrs) throws IOException {
      _out.putNextEntry(new ZipEntry(dir.toAbsolutePath().toString()+ "/"));
      return FileVisitResult.CONTINUE;
    }

    @Override
    public FileVisitResult visitFile(java.nio.file.Path file, BasicFileAttributes attrs) throws IOException {
      _out.putNextEntry(new ZipEntry(file.getFileName().toString()));
      String absoluteFilePath = file.toAbsolutePath().toString();
      LOG.info("Adding file: " + absoluteFilePath);
      try (InputStream in = new BufferedInputStream(new FileInputStream(absoluteFilePath))) {
        in.transferTo(_out);
      }
      return FileVisitResult.CONTINUE;
    }

  }
}
