<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn"  uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>
<%@ taglib prefix="api" uri="http://apidb.org/taglib"%>

<%@ attribute name="refer"
              required="true"
              description="page calling this tag"
%>
<%@ attribute name="showBanner"
              required="false"
              description="if true,it needs to show banner"
%>


<c:set var="project" value="${wdkModel.name}"/>

<api:messages var="information" projectName="${project}" messageCategory="Information"/>
<api:messages var="degraded" projectName="${project}" messageCategory="Degraded"/>
<api:messages var="down" projectName="${project}" messageCategory="Down"/>

<div
  data-controller="eupath.setup.siteAnnouncements"
  data-project-id="${project}"
  data-web-app-url="${pageContext.request.contextPath}"
  data-announcements='{"information": ${information}, "degraded": ${degraded}, "down": ${down}}'>
</div>
