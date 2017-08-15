<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core"
    xmlns:api="http://eupathdb.org/taglib"
    xmlns:wdk="urn:jsptagdir:/WEB-INF/tags/wdk"
    xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">

  <jsp:directive.attribute name="refer" required="false" 
              description="Page calling this tag"/>

  <c:set var="base" value="${pageContext.request.contextPath}"/>

  <jsp:useBean id="websiteRelease" class="org.eupathdb.common.controller.WebsiteReleaseConstants"/>
  <c:set var="debug" value="${requestScope.WEBSITE_RELEASE_STAGE eq websiteRelease.development}"/>

  <c:set var="model" value="${applicationScope.wdkModel.model}"/>
  <c:set var="props" value="${model.properties}"/>
  <c:set var="webAppUrl" value="${pageContext.request.contextPath}"/>

  <!-- only show information on home page. this jsp never gets loaded on home page -->
  <!-- FIXME Add logic to show information messages on homepage if this gets used for homepage -->
  <c:choose>
    <c:when test="${refer eq 'home'}">
      <api:messages var="information" projectName="${model.projectId}" messageCategory="Information"/>
    </c:when>
    <c:otherwise>
      <c:set var="information" value="[]"/>
    </c:otherwise>
  </c:choose>
  <api:messages var="degraded" projectName="${model.projectId}" messageCategory="Degraded"/>
  <api:messages var="down" projectName="${model.projectId}" messageCategory="Down"/>

  <script>
    // used for header and footer
    window.__SITE_CONFIG__ = {
      endpoint: "${webAppUrl}/service",
      displayName: "${model.displayName}",
      projectId: "${model.projectId}",
      buildNumber: "${model.buildNumber}",
      releaseDate: "${model.releaseDate}",
      webAppUrl: "${webAppUrl}",
      facebookUrl: "${props.FACEBOOK_URL}",
      twitterUrl: "${props.TWITTER_URL}",
      youtubeUrl: "${props.YOUTUBE_URL}",
      isLegacy: true
    };
    window.__SITE_ANNOUNCEMENTS__ = {
      information: ${information},
      degraded: ${degraded},
      down: ${down}
    };
  </script>

  <!-- JavaScript provided by WDK -->
  <imp:wdkJavascripts refer="${refer}" debug="${debug}"/>
  <imp:script src="site-legacy.bundle.js" charset="utf-8"/>

</jsp:root>
