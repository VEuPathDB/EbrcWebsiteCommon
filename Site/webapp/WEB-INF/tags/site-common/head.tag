<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:jsp="http://java.sun.com/JSP/Page"
  xmlns:c="http://java.sun.com/jsp/jstl/core"
  xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">

  <jsp:directive.attribute name="title" required="false"
    description="Value to appear in page's title"/>

  <jsp:directive.attribute name="refer" required="false" 
    description="Page calling this tag"/>

  <jsp:directive.attribute name="banner" required="false"
    description="Value to appear at top of page if there is no title provided"/>

  <c:set var="project" value="${applicationScope.wdkModel.properties['PROJECT_ID']}" />

  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge, chrome=1"/> 
    <title>
      <jsp:text>${empty title ? banner : title}</jsp:text>
    </title>
    <link rel="shortcut icon" type="image/x-icon" href="${pageContext.servletContext.contextPath}/images/${project}/favicon.ico"/> <!-- for IE7 -->
    <!-- StyleSheets provided by Site -->
    <imp:stylesheets refer="${refer}" /> 

    <!-- extra styling to get around the sidebar on home page. -->
    <c:if test="${refer eq 'home'}">
      <style>
        noscript .announcebox.warn { margin-left: 220px; }
      </style>
    </c:if>

    <!-- JavaScript provided by Site -->
    <imp:javascripts refer="${refer}"/>
    <jsp:doBody/>
  </head>
</jsp:root>
