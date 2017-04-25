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
  <c:set var="facebookUrl" value="${applicationScope.wdkModel.properties['FACEBOOK_URL']}" />
  <c:set var="twitterUrl" value="${applicationScope.wdkModel.properties['TWITTER_URL']}" />
  <c:set var="youtubeUrl" value="${applicationScope.wdkModel.properties['YOUTUBE_URL']}" />

  <c:if test="${not empty twitterUrl}">
    <li class="socmedia-link no-divider">
      <a target="_blank" href="${twitterUrl}" class="eupathdb-SocialMedia eupathdb-SocialMedia__twitter">
        <c:if test="${label}"><span>Follow us on Twitter!</span></c:if>
      </a>
    </li>
  </c:if>

  <c:if test="${not empty facebookUrl}">
    <li class="socmedia-link no-divider">
      <a target="_blank" href="${facebookUrl}" class="eupathdb-SocialMedia eupathdb-SocialMedia__facebook">
        <c:if test="${label}"><span>Follow us on Facebook!</span></c:if>
      </a>
    </li>
  </c:if>

  <c:if test="${not empty youtubeUrl}">
    <li class="socmedia-link no-divider">
      <a target="_blank" href="${youtubeUrl}" class="eupathdb-SocialMedia eupathdb-SocialMedia__youtube">
        <c:if test="${label}"><span>Follow us on YouTube!</span></c:if>
      </a>
    </li>
  </c:if>

</jsp:root>
