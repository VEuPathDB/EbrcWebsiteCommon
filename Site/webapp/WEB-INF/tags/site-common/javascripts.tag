<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core"
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
  <c:set var="assetsUrl" value="${model.modelConfig.assetsUrl ne null ? model.modelConfig.assetsUrl : webAppUrl}" />
  <c:set var="wdkServiceUrl" value ="${webAppUrl}${initParam.wdkServiceEndpoint}"/>

  <c:set var="recordClassesWithProjectId">
    [
      <c:forEach items="${applicationScope.wdkModel.recordClasses}" var="recordClass">
        <c:forEach items="${recordClass.primaryKeyDefinition.columnRefs}" var="columnName">
          <c:if test="${columnName eq 'project_id'}">
            "${recordClass.urlSegment}",
          </c:if>
        </c:forEach>
      </c:forEach>
    ]
  </c:set>

  <script>
    // used for webpack. remove this when this can be set at build time.
    window.__asset_path_remove_me_please__ = "${assetsUrl}/";

    // used for header and footer
    window.__SITE_CONFIG__ = {
      rootUrl: "${webAppUrl}/app",
      endpoint: "${wdkServiceUrl}",
      displayName: "${model.displayName}",
      projectId: "${model.projectId}",
      buildNumber: "${model.buildNumber}",
      releaseDate: "${model.releaseDate}",
      webAppUrl: "${webAppUrl}",
      facebookUrl: "${props.FACEBOOK_URL}",
      twitterUrl: "${props.TWITTER_URL}",
      youtubeUrl: "${props.YOUTUBE_URL}",
      vimeoUrl: "${props.VIMEO_URL}",
      recordClassesWithProjectId: ${recordClassesWithProjectId},
      isLegacy: true
    };
  </script>

  <!-- JavaScript provided by WDK -->
  <imp:wdkJavascripts refer="${refer}" debug="${debug}"/>
  <imp:script src="site-legacy.bundle.js" charset="utf-8"/>

</jsp:root>
