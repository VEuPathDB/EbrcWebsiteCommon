<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn"  uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>
<%@ taglib prefix="api" uri="http://eupathdb.org/taglib"%>

<%@ attribute name="refer"
              required="true"
              description="page calling this tag"
%>
<%@ attribute name="showBanner"
              required="false"
              description="if true,it needs to show banner"
%>


<c:set var="project" value="${wdkModel.name}"/>
<api:messages var="degraded" projectName="${project}" messageCategory="Degraded"/>
<api:messages var="down" projectName="${project}" messageCategory="Down"/>

  <!-- refer: ${refer} -->
<%-- only show information message from dashboard on home page --%>
<c:choose>
  <c:when test="${refer eq 'home'}">
    <api:messages var="information" projectName="${project}" messageCategory="Information"/>
  </c:when>
  <c:otherwise>
    <c:set var="information" value="[]"/>
  </c:otherwise>
</c:choose>

<div
  data-controller="eupath.setup.siteAnnouncements"
  data-project-id="${project}"
  data-web-app-url="${pageContext.request.contextPath}"
  data-announcements='{"information": ${fn:escapeXml(information)}, "degraded": ${fn:escapeXml(degraded)}, "down": ${fn:escapeXml(down)}}'>
</div>
