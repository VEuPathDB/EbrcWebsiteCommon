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

  <!-- set default facebook and twitter IDs (can be overridden in model properties) -->
  <c:set var="facebook" value="${applicationScope.wdkModel.properties['FACEBOOK_ID']}" />
  <c:set var="twitter" value="${applicationScope.wdkModel.properties['TWITTER_ID']}" />
  <c:set var="youtube" value="${applicationScope.wdkModel.properties['YOUTUBE_ID']}" />

  <c:if test="${not empty twitter}">
    <li class="socmedia-link no-divider">
      <a target="_blank" href="http://twitter.com/${twitter}" class="eupathdb-SocialMedia eupathdb-SocialMedia__twitter">
        <c:if test="${label}"><span>Follow us on Twitter!</span></c:if>
      </a>
    </li>
  </c:if>

  <c:if test="${not empty facebook}">
    <li class="socmedia-link no-divider">
      <a target="_blank" href="http://facebook.com/${facebook}" class="eupathdb-SocialMedia eupathdb-SocialMedia__facebook">
        <c:if test="${label}"><span>Follow us on Facebook!</span></c:if>
      </a>
    </li>
  </c:if>

  <c:if test="${not empty youtube}">
    <li class="socmedia-link no-divider">
      <a target="_blank" href="https://www.youtube.com/user/${youtube}/videos?sort=dd&amp;flow=list&amp;view=1" class="eupathdb-SocialMedia eupathdb-SocialMedia__youtube">
        <c:if test="${label}"><span>Follow us on YouTube!</span></c:if>
      </a>
    </li>
  </c:if>

</jsp:root>
