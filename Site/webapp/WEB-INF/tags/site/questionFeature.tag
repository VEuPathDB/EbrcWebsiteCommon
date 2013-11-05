<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
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
	<c:when test="${refer == 'questionPage'}">
		<c:set var="beta-icon" value="/wdk/images/beta2-40.png" />
  </c:when>
  <c:otherwise>
		<c:set var="beta-icon" value="/wdk/images/beta2-30.png" />
  </c:otherwise>
</c:choose>


<c:choose>

	<c:when test="${fn:containsIgnoreCase(question.questionSetName,'PathwayQuestions') || fn:containsIgnoreCase(question.questionSetName,'CompoundQuestions')}">
		<c:choose>
		<c:when test="${refer == 'questionPage'}">
 			<imp:image alt="Beta feature icon" title="This search is new and under revision, please provide feedback using the Contact Us link on the top header." src="/wdk/images/beta2-40.png" />
 		</c:when>
  	<c:otherwise>
      <imp:image alt="Beta feature icon" title="This search is new and under revision, please provide feedback using the Contact Us link on the top header." src="/wdk/images/beta2-30.png" />
  	</c:otherwise>
		</c:choose>
	</c:when>

	<c:otherwise>
		<c:choose>
  		<c:when test="${question.new}">
    		<imp:image alt="New feature icon" title="This is a new search!" 
        	src="/wdk/images/new-feature.png" />
  		</c:when>
  		<c:when test="${question.revised}">
    		<imp:image alt="Revised feature icon" title="This search has been revised. Changes might include new or changed parameters, upgrades to the underlying search logic, or new or updated data." 
         	src="/wdk/images/revised-small.png" />
  		</c:when>
			<c:when test="${question.queryName eq 'GenesByGenericFoldChange'}">
				<a style="float:right;font-size:80%;margin-right:1em" title="YouTube Fold Change search tutorial" href="http://www.youtube.com/watch?v=jMuVB-ZIdH0" target="_blank" onclick="poptastic(this.href); return false;">
  				 Tutorial <img border="0"  style="vertical-align:middle;" alt="YouTube icon - Fold Change search tutorial" src="/assets/images/youtube_32x32.png"/>
				</a>
			</c:when>
		</c:choose>
	</c:otherwise>

</c:choose>

