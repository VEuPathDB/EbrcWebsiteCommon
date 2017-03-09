<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:jsp="http://java.sun.com/JSP/Page"
  xmlns:c="http://java.sun.com/jsp/jstl/core"
  xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">

  <jsp:directive.attribute name="refer" required="false" 
    description="Page calling this tag"/>

  <c:set var="project" value="${applicationScope.wdkModel.name}" />
  <c:set var="modelName" value="${applicationScope.wdkModel.name}" />
  <c:set var="wdkModel" value="${applicationScope.wdkModel}"/>
  <c:set var="wdkUser" value="${sessionScope.wdkUser}"/>

  <span class="onload-function" data-function="eupath.setup.configureMenuBar"><jsp:text/></span>

  <div id="menu" class="ui-helper-clearfix">
    <ul class="sf-menu">
      <li><a href="/"><span>Home</span></a></li>
      <imp:wdkMenu />
      <jsp:doBody/>
    </ul>
  </div>

</jsp:root>
