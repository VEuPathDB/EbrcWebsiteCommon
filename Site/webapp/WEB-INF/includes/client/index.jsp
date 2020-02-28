<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>

<c:set var="model" value="${applicationScope.wdkModel.model}"/>
<c:set var="props" value="${model.properties}"/>
<c:set var="webAppUrl" value="${pageContext.request.contextPath}"/>
<c:set var="assetsUrl" value="${model.modelConfig.assetsUrl ne null ? model.modelConfig.assetsUrl : webAppUrl}" />
<c:set var="wdkServiceUrl" value="${webAppUrl}${initParam.wdkServiceEndpoint}"/>
<c:set var="gaId" value="${applicationScope.wdkModel.properties['GOOGLE_ANALYTICS_ID']}"/>
<c:set var="project" value="${props['PROJECT_ID']}"/>

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

<c:choose>
      <c:when test="${project eq 'ClinEpiDB' || project eq 'AllClinEpiDB'}">
        <c:set var="room" value="VEuPathDB-clinepi"/>
      </c:when>
      <c:when test="${project eq 'MicrobiomeDB'}">
        <c:set var="room" value="VEuPathDB-microbiome"/>
      </c:when>
      <c:otherwise>
        <c:set var="room" value="VEuPathDB-genomic"/>
      </c:otherwise>
</c:choose>


<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <imp:stylesheet href="images/${model.projectId}/favicon.ico" type="image/x-icon" rel="shortcut icon"/>
    <imp:script src="siteConfig.js"/>
    <link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"/>
    <imp:stylesheet rel="stylesheet" type="text/css" href="site-client.bundle.css"/>
    <imp:script charset="utf8" src="site-client.bundle.js" ></imp:script>

<script>
  ((window.gitter = {}).chat = {}).options = {
    room: '${room}/community'
  };
</script>
<script src="https://sidecar.gitter.im/dist/sidecar.v1.js" async defer></script>

  </head>
  <body>
    <div class="main-stack">
      <div id="wdk-container">Loading...</div>
    </div>
  </body>
</html>
