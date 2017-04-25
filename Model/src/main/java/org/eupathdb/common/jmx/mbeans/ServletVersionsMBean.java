package org.eupathdb.common.jmx.mbeans;

public interface ServletVersionsMBean {
  public String getServerInfo();
  public String getJspSpecVersion();
  public String getServletApiVersion();
}
