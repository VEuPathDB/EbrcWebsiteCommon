<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="wdk" tagdir="/WEB-INF/tags/wdk" %>
<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>

<%@ attribute name="question"
              required="true"
              type="org.gusdb.wdk.model.jspwrap.QuestionBean"
              description="The question to be rendered"
%>
<%@ attribute name="refer" 
              type="java.lang.String"
              required="false" 
              description="Page calling this tag"
%>

<c:choose>

<%-- ORFS to BE RETIRED  ICON --%>
  <c:when test="${fn:containsIgnoreCase(question.name,'Orf')}">
    <imp:image alt="To Be Retired icon" title="ORF searches to be restired" 
               src="wdk/images/toBeRetired.png" width="10%"/>
  </c:when>

<%-- BETA ICON --%>
  <c:when test="${fn:containsIgnoreCase(question.name,'GenesByRNASeqUserDataset')}">
    <c:set var="betaIconFile" value="${refer eq 'questionPage' ? 'beta2-40.png' : 'beta2-30.png'}"/>
    <imp:image alt="Beta feature icon" title="This search is new and under revision; please provide feedback using the Contact Us link on the top header." 
			src="wdk/images/${betaIconFile}"/>
  </c:when>

<%-- TUTORIAL --%>
  <c:when test="${question.queryName eq 'GenesByGenericFoldChange' and refer ne 'webservices'}">
    <a style="float:right;font-size:80%;margin-right:1em" title="YouTube Fold Change search tutorial" 
			href="http://www.youtube.com/watch?v=jMuVB-ZIdH0" target="_blank" onclick="poptastic(this.href); return false;">Tutorial 
			  <imp:image border="0"  style="vertical-align:middle;" alt="YouTube icon - Fold Change search tutorial" 
				  src="images/youtube_32x32.png"/>
    </a>
  </c:when>


<%-- Provided by WDK:  "NEW" AND "REVISED" ICONS --%>
  <c:otherwise>
    <wdk:questionFeature question="${question}" />
  </c:otherwise>
</c:choose>

