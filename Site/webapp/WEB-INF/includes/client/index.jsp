<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>

<c:set var="project" value="${applicationScope.wdkModel.model.projectId}"/>

<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <imp:stylesheet href="images/${project}/favicon.ico" type="image/x-icon" rel="shortcut icon"/>
    <imp:script src="siteConfig.js"/>
    <link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"/>
    <imp:stylesheet rel="stylesheet" type="text/css" href="site-client.bundle.css"/>
    <imp:script charset="utf8" src="site-client.bundle.js" ></imp:script>
  </head>
  <body>
    <div class="main-stack">
      <div id="wdk-container">Loading...</div>
    </div>
  </body>

 <c:if test="${project ne 'ClinEpiDB' && project ne 'AllClinEpiDB'}">
    <c:choose>   
      <c:when test="${project eq 'MicrobiomeDB'}">
        <c:set var="room" value="VEuPathDB-microbiome"/>
      </c:when>
      <c:otherwise>
        <c:set var="room" value="VEuPathDB-genomic"/>
      </c:otherwise>
    </c:choose>

    <script>
      ((window.gitter = {}).chat = {}).options = {
        room: '${room}/community'
      };
    </script>
    <script src="https://sidecar.gitter.im/dist/sidecar.v1.js" async defer></script>

  </c:if>


</html>
