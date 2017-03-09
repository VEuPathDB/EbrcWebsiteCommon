<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">
  <jsp:directive.page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"/>
     
  <!-- display page header with wdkAnswer's recordClass's type as banner -->
  <c:if test="${resultOnly}">
    <imp:pageFrame title="Error Displaying Results" refer="summaryError">
      <imp:summaryError/>
    </imp:pageFrame>
  </c:if>
  <c:if test="${not resultOnly}">
    <summaryError/>
  </c:if>
</jsp:root>
