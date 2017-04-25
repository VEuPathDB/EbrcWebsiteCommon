<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core"
    xmlns:fn="http://java.sun.com/jsp/jstl/functions"
    xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">
  <jsp:directive.page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"/>

  <c:set var="wdkStep" value="${requestScope.wdkStep}" />
  <c:set var="wdkAnswer" value="${wdkStep.answerValue}"/>


<pre>${blastHeader}</pre>

<c:forEach items="${wdkAnswer.records}" var="record">
  <c:set var="summary" value="${record.attributes['summary'].value}"/>
  <pre>${summary}</pre>
</c:forEach>

<pre>${blastMiddle}</pre>

<c:forEach items="${wdkAnswer.records}" var="record">
  <c:set var="alignment" value="${record.attributes['alignment'].value}"/>
  <pre>${alignment}</pre>
</c:forEach>

<pre>${blastFooter}</pre>

</jsp:root>
