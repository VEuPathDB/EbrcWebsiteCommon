package org.eupathdb.common.service;

import java.sql.Connection;
import java.sql.SQLException;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;

import org.gusdb.fgputil.runtime.ThreadUtil;
import org.gusdb.wdk.service.service.AbstractWdkService;

@Path("/sleep")
public class SleepService extends AbstractWdkService {

  @GET
  @Path("db-r")
  public Response sleep1(@QueryParam("ms") @DefaultValue("0") Long milliseconds) throws SQLException {
    try (Connection conn = getWdkModel().getAppDb().getDataSource().getConnection()) {
      ThreadUtil.sleep(milliseconds);
      return Response.noContent().build();
    }
  }

  @GET
  @Path("db-g")
  public Response sleep2(@QueryParam("ms") @DefaultValue("0") Long milliseconds) throws SQLException {
    try (Connection conn = getWdkModel().getAppDb().getDataSource().getConnection()) {
      ThreadUtil.sleep(milliseconds);
      return Response.noContent().build();
    }
  }

  @GET
  @Path("medium")
  public Response sleep3(@QueryParam("ms") @DefaultValue("0") Long milliseconds) {
    ThreadUtil.sleep(milliseconds);
    return Response.noContent().build();
  }

  @GET
  @Path("fast")
  public Response sleep4(@QueryParam("ms") @DefaultValue("0") Long milliseconds) {
    ThreadUtil.sleep(milliseconds);
    return Response.noContent().build();
  }
}
