package org.eupathdb.common.jmx.mbeans;

import org.gusdb.wdk.jmx.BeanBase;

public class ServletVersions extends BeanBase implements ServletVersionsMBean   {

  /**
   * Version of the Tomcat server.
   * e.g. Apache Tomcat/5.5.30
   */
  @Override
  public String getServerInfo() {
    return getContext().getServerInfo();
  }

  /**
   *  version number of the JSP specification that is supported by the JSP engine
   */
  @Override
  public String getJspSpecVersion()  {
    javax.servlet.jsp.JspFactory f = javax.servlet.jsp.JspFactory.getDefaultFactory();
    if ( f != null) {
      return f.getEngineInfo().getSpecificationVersion();
    }
    return null;
  }
  
  /**
   * Servlet API version that the servlet container supports.
   */
  @Override
  public String getServletApiVersion() {
    return getContext().getMajorVersion() + "." + getContext().getMinorVersion();
  }

}

/**
app.serverInfo
    Servlet container:	Apache Tomcat/5.5.30
        application.getServerInfo();

app.servletInfo
    Servlet info:	Jasper JSP 2.0 Engine
        ((Servlet)pageContext.getPage()).getServletInfo();
        
app.servletApiVersion
    Servlet API version:	2.4
        application.getMajorVersion() + "." + application.getMinorVersion();

**/
