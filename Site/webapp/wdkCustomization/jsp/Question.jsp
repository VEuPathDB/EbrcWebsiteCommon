<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:jsp="http://java.sun.com/JSP/Page"
  xmlns:c="http://java.sun.com/jsp/jstl/core"
  xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">
  <jsp:directive.page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"/>

  <!-- Must wrap page content in page frame only if partial is not specified as true -->
  <c:choose>
    <c:when test="${empty partial or partial eq false}">
      <imp:pageFrame title="Search for ${wdkQuestion.recordClass.displayName}s by ${wdkQuestion.displayName}" refer="question">
        <imp:questionPageContent/>
      </imp:pageFrame>
      <!-- log screen and browser window size for awstats; excluded when page is called by Ajax (internal
       questions; partial == true)  because it breaks IE7. When using internal questions, the parent 
       question page will still call this once.
      -->
      <imp:script src="js/awstats_misc_tracker.js"/>
      <noscript><imp:image src="js/awstats_misc_tracker.js?nojs=y" height="0" width="0" border="0" style="display: none"/></noscript>
    </c:when>
    <c:otherwise>
      <imp:questionPageContent/>
    </c:otherwise>
  </c:choose>
</jsp:root>
