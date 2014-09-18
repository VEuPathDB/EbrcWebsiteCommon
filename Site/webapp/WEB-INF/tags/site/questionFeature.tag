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
<%-- BETA ICON --%>
  <c:when test="${fn:containsIgnoreCase(question.questionSetName,'PathwayQuestions') || 
									fn:containsIgnoreCase(question.questionSetName,'CompoundQuestions') || 
                  fn:containsIgnoreCase(question.name,'GenesByReactionCompounds') || 
									( !fn:containsIgnoreCase(question.name,'GenesByMetabolicPathwayHagai') && 
                    fn:containsIgnoreCase(question.name,'GenesByMetabolicPathway') 
                  ) 
                 }">
    <c:set var="betaIconFile" value="${refer eq 'questionPage' ? 'beta2-40.png' : 'beta2-30.png'}"/>
    <imp:image alt="Beta feature icon" title="This search is new and under revision; please provide feedback using the Contact Us link on the top header." 
			src="wdk/images/${betaIconFile}"/>
  </c:when>

<%-- TUTORIAL --%>
  <c:when test="${question.queryName eq 'GenesByGenericFoldChange' and refer ne 'webservices'}">
    <a style="float:right;font-size:80%;margin-right:1em" title="YouTube Fold Change search tutorial" 
			href="http://www.youtube.com/watch?v=jMuVB-ZIdH0" target="_blank" onclick="poptastic(this.href); return false;">Tutorial 
			  <img border="0"  style="vertical-align:middle;" alt="YouTube icon - Fold Change search tutorial" 
				  src="/assets/images/youtube_32x32.png"/>
    </a>
  </c:when>

<%-- this only works if we move the call <imp:questionFeature.../> outside the search page title, in questionPageContent.tag
  <c:when test="${ ( fn:endsWith(question.queryName,'BySimilarity') || fn:endsWith(question.queryName,'Blast') )  && refer ne 'webservices' }">
		<div class="h3center">As of 3 Feb 2014, this search uses NCBI-BLAST to determine sequence similarity. 
			Prior&nbsp;versions&nbsp;of&nbsp;the&nbsp;search&nbsp;used&nbsp;WU-BLAST.
		</div>  
		<div class="h3center">
		  <a target="_blank" href="http://www.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Web&PAGE_TYPE=BlastDocs">NCBI-BLAST help.</a></div>
	</c:when>
--%>


<%-- Provided by WDK:  "NEW" AND "REVISED" ICONS --%>
  <c:otherwise>
		<wdk:questionFeature question="${question}" />
  </c:otherwise>
</c:choose>

