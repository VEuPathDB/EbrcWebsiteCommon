<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core"
    xmlns:fmt="http://java.sun.com/jsp/jstl/fmt"
    xmlns:fn="http://java.sun.com/jsp/jstl/functions"
    xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">

  <jsp:directive.attribute name="gaId" required="true"
      description="Google Analytics ID"/>

  <c:set var="serverNameParts" value="${fn:split(pageContext.request.serverName, '.')}"/>
  <c:set var="serverNameLength" value="${fn:length(serverNameParts)}"/>
  <c:set var="domain" value="${serverNameParts[serverNameLength - 2]}.${serverNameParts[serverNameLength - 1]}"/>

  <script>
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', '${gaId}', '${domain}');
    ga('set', 'anonymizeIp', true);
    ga('send', 'pageview');
  </script>

</jsp:root>
