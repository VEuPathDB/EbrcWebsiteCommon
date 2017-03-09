<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:jsp="http://java.sun.com/JSP/Page"
  xmlns:c="http://java.sun.com/jsp/jstl/core"
  xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">
  <jsp:directive.page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"/>

  <!-- get wdkXmlQuestionSets saved in request scope -->
  <c:set var="xmlQSets" value="${requestScope.wdkXmlQuestionSets}"/>

  <imp:pageFrame title="News">

    <!-- show all xml question sets -->
    <div id="cirbulletlist">
      <ul>
        <c:forEach items="${xmlQSets}" var="qSet">
          <c:set var="qSetName" value="${qSet.name}"/>
          ${qSet.displayName}:<br/>

          <!-- show all xml questions in this set -->
          <c:set var="xqs" value="${qSet.questions}"/>
          <c:forEach items="${xqs}" var="q">
            <c:set var="qName" value="${q.name}"/>
            <c:if test="${qName ne 'StrategiesHelp'}">
              <!-- This content is available in top menu -->
              <li>
                <a href="${pageContext.request.contextPath}/showXmlDataContent.do?name=${qSetName}.${qName}">${q.displayName}</a>
              </li>
            </c:if>
          </c:forEach>
        </c:forEach>
      </ul>
    </div>

  </imp:pageFrame>
</jsp:root>
