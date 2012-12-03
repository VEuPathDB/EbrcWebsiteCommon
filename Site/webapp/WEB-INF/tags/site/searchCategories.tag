<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<!-- simplified version of the tag provided by WDK -->

<c:set var="model" value="${applicationScope.wdkModel}" />
<c:set var="project" value="${model.displayName}" />

<c:forEach items="${model.websiteRootCategories}" var="item">
  <c:set var="category" value="${item.value}" />  
	<c:choose>
		<c:when test="${ fn:containsIgnoreCase(category.displayName,'groups')}"> 
  		<c:set var="bubbleTitle" value="bubble_id_ortholog.png" />
		</c:when>
		<c:when test="${ fn:containsIgnoreCase(category.displayName,'sequences')}">
  		<c:set var="bubbleTitle" value="bubble_id_protein_seq.png" />
		</c:when>
	</c:choose>

	<li>
		 <!--  <a class="parent category"><span>${category.displayName}</span></a> -->
		<img src="/assets/images/OrthoMCL/${bubbleTitle}" alt="${category.displayName}" />
		<c:set var="categories" value="${category.websiteChildren}" />

   	<ul id="info">
    	<c:forEach items="${categories}" var="item">
				<li>
					<c:set var="category" value="${item.value}" />
		  	  <span style="font-size:120%">${category.displayName}</span>
			  	<c:set var="questions" value="${category.websiteQuestions}" />
	  			<ul>
						<c:forEach items="${questions}" var="question">
      				<li>
        				<c:url var="questionUrl" value="/showQuestion.do?questionFullName=${question.fullName}"/>
          			<a href="${questionUrl}"><span>${question.displayName}</span></a>
          			<imp:questionFeature question="${question}" />
        			</li>
      			</c:forEach>
					</ul>
				</li>
      </c:forEach>
    </ul>
    <div id="infobottom"></div>
  </li>
</c:forEach>

