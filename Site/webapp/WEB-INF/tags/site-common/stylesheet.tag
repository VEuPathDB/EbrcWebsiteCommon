<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:jsp="http://java.sun.com/JSP/Page"
  xmlns:c="http://java.sun.com/jsp/jstl/core"
  xmlns:assetsfn="http://eupathdb.org/jsp/tlds/assetsfn">

  <jsp:directive.tag body-content="empty" dynamic-attributes="dynattrs"/>

  <jsp:useBean id="websiteRelease" class="org.eupathdb.common.controller.WebsiteReleaseConstants"/>

  <c:set var="href" value="${dynattrs['href']}"/>
  <c:if test="${requestScope.WEBSITE_RELEASE_STAGE gt websiteRelease.development}">
    <c:set var="href" value="${assetsfn:fingerprint(dynattrs['href'], pageContext.servletContext)}"/>
  </c:if>

  <![CDATA[<link]]>

  <c:forEach items="${dynattrs}" var="a">
    <c:choose>
      <c:when test="${a.key eq 'href'}"> href="${pageContext.request.contextPath}/${href}" </c:when>
      <c:otherwise> ${a.key}="${a.value}" </c:otherwise>
    </c:choose>
  </c:forEach>

  <![CDATA[/>]]>

</jsp:root>
