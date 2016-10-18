<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core">

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
  <c:set var="youtube" value="${applicationScope.wdkModel.properties['YOUTUBE_ID']}" />

  <c:if test="${not empty twitter}">
    <li class="socmedia-link no-divider">
      <a target="_blank" href="http://twitter.com/${twitter}">
        <span class="twitter ${classx}" title="Follow us on Twitter!"><jsp:text/></span>
        <c:if test="${label}"><span>Follow us on Twitter!</span></c:if>
      </a>
    </li>
  </c:if>

  <c:if test="${not empty facebook}">
    <li class="socmedia-link no-divider">
      <a target="_blank" href="http://facebook.com/${facebook}">
        <span class="facebook ${classx}" title="Follow us on Facebook!"><jsp:text/></span>
        <c:if test="${label}"><span>Follow us on Facebook!</span></c:if>
      </a>
    </li>
  </c:if>

  <c:if test="${not empty youtube}">
    <li class="socmedia-link no-divider">
      <a target="_blank" href="https://www.youtube.com/user/${youtube}/videos?sort=dd&amp;flow=list&amp;view=1">
        <span class="youtube ${classx}" title="Follow us on YouTube!"><jsp:text/></span>
        <c:if test="${label}"><span>Follow us on YouTube!</span></c:if>
      </a>
    </li>
  </c:if>

</jsp:root>
