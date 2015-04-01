<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>
<%@ taglib prefix="html" uri="http://struts.apache.org/tags-html" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<c:set var="recordName" value="${wdkQuestion.recordClass.displayNamePlural}"/>
<c:set var="q" value="${wdkQuestion}"/>


<c:set var="webProps" value="${wdkQuestion.propertyLists['websiteProperties']}" />
<c:set var="hideOperation" value="${false}" />
<c:set var="hideTitle" value="${false}" />
<c:set var="hideAttrDescr" value="${false}" />

<c:forEach var="prop" items="${webProps}">
  <c:choose>
    <c:when test="${prop == 'hideOperation'}"><c:set var="hideOperation" value="${true}" /></c:when>
    <c:when test="${prop == 'hideTitle'}"><c:set var="hideTitle" value="${true}" /></c:when>
    <c:when test="${prop == 'hideAttrDescr'}"><c:set var="hideAttrDescr" value="${true}" /></c:when>
  </c:choose>
</c:forEach>

<!-- questionFeature adds icons and tutorials -->
<!-- having questionFeature as part of the title means it cannot be used for banners; use the extraBanner tag for that -->
<c:if test="${hideTitle == false}">
  <h1 class="ui-helper-clearfix">Identify ${recordName} based on ${wdkQuestion.displayName}
    <imp:questionFeature question="${wdkQuestion}" refer="questionPage"/>
  </h1>
</c:if>

<c:if test="fn:containsIgnoreCase(q.questionSetName,'Internal')}">
<br><center style="position:relative;bottom:20px;font-size:120%;font-family:Verdana">
  <a href="#query-description-section">[Description]</a> | 
  <a href="#attributions-section">[Data Sets]</a> 
</center>
</c:if>

<a name="query-search-form"></a>

<div id="query-search-form">
  <html:form method="post" enctype='multipart/form-data' action="/processQuestion.do">
    <imp:questionForm />

    <c:if test="${hideOperation == false}">
        <div title="Click to run a search and generate the first step of a new strategy." class="filter-button">
					<html:submit property="questionSubmit" 
												value="Get Answer" 
												title="Click to run a search and generate the first step of a new strategy."  
												style="font-size:110%;font-family:Arial,Helvetica,sans-serif;"/>
				</div>	
				<imp:nameStep/>
    </c:if>

  </html:form>
</div>

<%-- displays question description, can be overridden by the custom question form --%>
<c:if test="${hideAttrDescr == false}">
  <hr/>
  <!-- <div class="content-pane snippet" style="padding:1em 2em"> -->
    <div><imp:questionDescription /></div>
    <!-- </div> -->
</c:if>
