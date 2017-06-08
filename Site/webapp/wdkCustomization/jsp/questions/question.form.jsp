<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<c:set var="webProps" value="${wdkQuestion.propertyLists['websiteProperties']}" />
<c:set var="useWizard" value="${false}" />
<c:forEach var="prop" items="${webProps}">
  <c:if test="${prop eq 'useWizard'}">
    <c:set var="useWizard" value="${true}" />
  </c:if>
</c:forEach>

<c:choose>
  <c:when test="${useWizard eq true}">
    <imp:questionWizard question="${wdkQuestion}"/>
  </c:when>
  <c:otherwise>
    <imp:question/>
  </c:otherwise>
</c:choose>
