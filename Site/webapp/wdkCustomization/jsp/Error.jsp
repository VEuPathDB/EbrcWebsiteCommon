<%
/** 
  By default this page returns a "200 OK" HTTP status which prevents error 
  detection with a HEAD request. So force a 5xx status code.
  Our Apache configuration intercepts 503 codes and redirects to a different
  error page, so we are left with 500.
**/
response.setStatus(500);
%>
<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<c:catch var='e'>
  <imp:pageFrame title="Unexpected Error">
    <em>Sorry, an unexpected error has occurred.</em>
  </imp:pageFrame>
</c:catch>

<c:if test="${e != null}">
  <script>
    //alert("Sorry, an unexpected error has occurred.  ${e}")
    document.body.innerHTML = '<br><br><h1>Sorry, an unexpected error has occurred.</h1><br><br><br><br><br>Please make a snapshot and attach to an email to help@eupathdb.org. Thanks!';
  </script>
</c:if>

