<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:jsp="http://java.sun.com/JSP/Page"
  xmlns:c="http://java.sun.com/jsp/jstl/core"
  xmlns:wdk="urn:jsptagdir:/WEB-INF/tags/wdk"
  xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">

  <jsp:directive.attribute name="refer" required="false" 
    description="Page calling this tag"/>

  <c:set var="base" value="${pageContext.request.contextPath}"/>
  <c:set var="project" value="${applicationScope.wdkModel.projectId}"/>

  <jsp:useBean id="websiteRelease" class="org.eupathdb.common.controller.WebsiteReleaseConstants"/>
  <c:set var="debug" value="${requestScope.WEBSITE_RELEASE_STAGE eq websiteRelease.development}"/>
  <!-- includes the original wdk includes -->
  <wdk:wdkStylesheets refer="${refer}" debug="${debug}"/>

  <imp:stylesheet rel="stylesheet" type="text/css" href="site-legacy.bundle.css"/>

</jsp:root>
