<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core">

  <!-- JSP constants -->
  <jsp:useBean id="constants" class="org.eupathdb.common.model.JspConstants"/>

  <jsp:directive.attribute name="small"
      required="false"
      type="java.lang.Boolean"
      description="Use small icons"/>

  <jsp:directive.attribute name="label"
      required="false"
      type="java.lang.Boolean"
      description="Use link text"/>

  <c:set var="classx"><c:if test="${small}">small</c:if></c:set>

  <!-- set default facebook and twitter IDs (can be overridden in model properties) -->
  <c:set var="facebook" value="${applicationScope.wdkModel.properties['FACEBOOK_ID']}" />
  <c:set var="twitter" value="${applicationScope.wdkModel.properties['TWITTER_ID']}" />
  <c:if test="${empty facebook}">
    <c:set var="facebook" value="pages/EuPathDB/133123003429972"/>
  </c:if>
  <c:if test="${empty twitter}">
    <c:set var="twitter" value="EuPathDB"/>
  </c:if>

  <!-- store the links in the DOM so they are reachable via nav.js functions, -->
  <!--   called from smallMenu, sidebar community, menubar community etc.     -->
  
  <li class="socmedia-link no-divider">
    <a href="http://twitter.com/${twitter}">
      <span class="twitter ${classx}" title="Follow us on Twitter!"><jsp:text/></span>
      <c:if test="${label}"><span>Follow us on Twitter!</span></c:if>
    </a>
  </li>
  <li class="socmedia-link no-divider">
    <a href="http://facebook.com/${facebook}">
      <span class="facebook ${classx}" title="Follow us on Facebook!"><jsp:text/></span>
      <c:if test="${label}"><span>Follow us on Facebook!</span></c:if>
    </a>
  </li>
  <li class="socmedia-link no-divider">
    <a href="${constants.youtubeUrl}">
      <span class="youtube ${classx}" title="Follow us on YouTube!"><jsp:text/></span>
      <c:if test="${label}"><span>Follow us on YouTube!</span></c:if>
    </a>
  </li>

</jsp:root>
