<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>

<%@ attribute name="from" description="page using this tag" %>

<!-- simplified version of the tag provided by WDK -->

<c:set var="model" value="${applicationScope.wdkModel}" />
<c:set var="project" value="${model.displayName}" />
<c:set var="urlBase" value="${pageContext.request.contextPath}"/>

<c:choose>
  <c:when test="${from ne 'webservices'}">
    <c:set var="rootCategories" value="${model.websiteRootCategories}"/>
  </c:when>
  <c:otherwise>
    <c:set var="rootCategories" value="${model.webserviceRootCategories}"/>
  </c:otherwise>
</c:choose>

<c:forEach items="${rootCategories}" var="item">
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
    <c:choose>
      <c:when test="${from eq 'home'}">
        <imp:image class="bubble-header" src="images/OrthoMCL/${bubbleTitle}" alt="${category.displayName}" />
      </c:when>
      <c:when test="${form eq 'webservices'}">
        <h3><a href="${urlBase}/webservices/${category.name}.wadl">${category.displayName}</a></h3>
      </c:when>
      <c:otherwise>
        <a class="parent category"><span>${category.displayName}</span></a>
      </c:otherwise>
    </c:choose>

    <c:choose>
      <c:when test="${from ne 'webservices'}">
        <c:set var="categories" value="${category.websiteChildren}"/>
      </c:when>
      <c:otherwise>
        <c:set var="categories" value="${category.webserviceChildren}"/>
      </c:otherwise>
    </c:choose>

    <c:choose>
      <c:when test="${from eq 'home'}">
        <ul class="info">
      </c:when>
      <c:otherwise>
        <ul>
      </c:otherwise>
    </c:choose>

      <c:forEach items="${categories}" var="item">
        <c:choose>
          <c:when test="${from eq 'webservices' or from eq 'home'}">
            <li>
              <c:set var="category" value="${item.value}" />
              <span data-flatten-in-menu="${category.flattenInMenu}" style="font-size:120%">${category.displayName}</span>
              <c:choose>
                <c:when test="${from ne 'webservices'}">
                  <c:set var="questions" value="${category.websiteQuestions}"/>
                </c:when>
                <c:otherwise>
                  <c:set var="questions" value="${category.webserviceQuestions}"/>
                </c:otherwise>
              </c:choose>
              <ul>
                <c:forEach items="${questions}" var="question">
                  <li>
                    <c:choose>
                      <c:when test="${from ne 'webservices'}">
                        <c:url var="questionUrl" value="/showQuestion.do?questionFullName=${question.fullName}"/>
                      </c:when>
                      <c:otherwise>
                        <c:url var="questionUrl" value="/webservices/${question.questionSetName}/${question.name}.wadl"/>
                      </c:otherwise>
                    </c:choose>
                    <a href="${questionUrl}"><span>${question.displayName}</span></a>
                    <imp:questionFeature question="${question}" />
                  </li>
                </c:forEach>
              </ul>
            </li>
          </c:when>
          <c:otherwise>
            <c:forEach items="${item.value.websiteQuestions}" var="question">
              <c:url var="questionUrl" value="/showQuestion.do?questionFullName=${question.fullName}"/>
              <li><a href="${questionUrl}"><span>${question.displayName}</span></a></li>
            </c:forEach>
          </c:otherwise>
        </c:choose>
      </c:forEach>
    </ul>
    <c:if test="${from eq 'home'}">
      <div class="infobottom"></div>
    </c:if>
  </li>
</c:forEach>

