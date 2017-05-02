<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:jsp="http://java.sun.com/JSP/Page"
  xmlns:c="http://java.sun.com/jsp/jstl/core"
  xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">

  <jsp:directive.attribute name="refer" required="false" 
    description="Page calling this tag"/>

  <footer data-controller="eupath.setup.footer">
    <div id="fixed-footer"><jsp:text/></div>
  </footer>

  <c:set var="gaId" value="${applicationScope.wdkModel.properties['GOOGLE_ANALYTICS_ID']}"/>
  <c:if test="${gaId ne 'none'}">
    <imp:googleAnalytics gaId="${gaId}"/>
  </c:if>

</jsp:root>
