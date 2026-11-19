package org.eupathdb.common.service;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;

import org.gusdb.fgputil.runtime.ThreadUtil;

@Path("/sleep")
public class SleepService {

  @GET
  @Path("slow-r")
  public Response sleep1(@QueryParam("ms") @DefaultValue("0") Long milliseconds) {
    ThreadUtil.sleep(milliseconds);
    return Response.noContent().build();
  }

  @GET
  @Path("slow-g")
  public Response sleep2(@QueryParam("ms") @DefaultValue("0") Long milliseconds) {
    ThreadUtil.sleep(milliseconds);
    return Response.noContent().build();
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
