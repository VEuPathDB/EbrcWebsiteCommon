<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core"
    xmlns:wdk="urn:jsptagdir:/WEB-INF/tags/wdk"
    xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">

  <jsp:directive.attribute name="refer" required="false" 
              description="Page calling this tag"/>

  <c:set var="base" value="${pageContext.request.contextPath}"/>

  <jsp:useBean id="websiteRelease" class="org.eupathdb.common.controller.WebsiteReleaseConstants"/>
  <c:set var="debug" value="${requestScope.WEBSITE_RELEASE_STAGE eq websiteRelease.development}"/>

  <script>
    // used by apidb to initialize wdk
    window.__SITE_CONFIG__ = {
      projectId: "${applicationScope.wdkModel.projectId}",
      webAppUrl: "${pageContext.request.contextPath}",
      endpoint: "${pageContext.request.contextPath}/service"
    };
  </script>

  <!-- JavaScript provided by WDK -->
  <imp:wdkJavascripts refer="${refer}" debug="${debug}"/>
  <imp:script src="site-legacy.bundle.js"/>

</jsp:root>
