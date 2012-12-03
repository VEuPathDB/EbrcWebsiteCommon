<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="wdk" tagdir="/WEB-INF/tags/wdk" %>

<%@ attribute name="refer" 
                          type="java.lang.String"
                          required="false" 
                          description="Page calling this tag"
%>


<c:set var="model" value="${applicationScope.wdkModel}" />
<c:set var="wdkUser" value="${sessionScope.wdkUser}" />
<c:set var="basketCount" value="${wdkUser.basketCount}"/>

<%-- new search menu --%>
<li>
  <a title="START a NEW search strategy. Searches are organized by the genomic feature they return."
    ><span>New Search</span>
  </a>
  <ul><wdk:searchCategories /></ul>
</li>

<%-- strategy menu --%>
<li>
  <a id="mysearch" onclick="setCurrentTabCookie('application','strategy_results');" 
     href="<c:url value="/showApplication.do"/>" title="Access your Search Strategies Workspace"
    ><span>My Strategies<%--
     <span title="You have ${count} strategies" class="subscriptCount">(${count})</span>
  --%></span>
  </a>
</li>

<%-- basket menu --%>
<c:choose>
  <c:when test="${wdkUser == null || wdkUser.guest}">
    <c:set var="clickEvent" value="setCurrentTabCookie('application', 'basket'); User.login('/showApplication.do');" />
    <c:set var="title" value="Group IDs together to work with them. You can add IDs from a result, or from a details page." />
    <c:set var="href" value="javascript:void(0)" />
  </c:when>
  <c:when test="${refer == 'summary'}">
    <c:set var="clickEvent" value="showPanel('basket');" />
    <c:set var="title" value="Group IDs together to later make a step in a strategy." />
    <c:set var="href" value="javascript:void(0)" />
  </c:when>
  <c:otherwise>
    <c:set var="clickEvent" value="setCurrentTabCookie('application', 'basket');" />
    <c:set var="title" value="Group IDs together to later make a step in a strategy." />
    <c:url var="href" value="/showApplication.do" />
  </c:otherwise>
</c:choose>
<li>
  <a id="mybasket" onclick="${clickEvent}" href="${href}" title="${title}"
    ><span>My Basket <span class="subscriptCount">(${basketCount})</span></span>
  </a>
</li>

<%-- favorite menu --%>
<li id="favorite-menu">
<c:choose>
  <c:when test="${wdkUser eq null or wdkUser.guest}">
      <a id="mybasket" onclick="User.login('/showFavorite.do');"
         href="javascript:void(0)"
         title="Store IDs for easy access to their details page. You can add IDs *only* from the details page, one at a time." 
        ><span><img style="vertical-align:middle" height="20" 
              src="<c:url value="/wdk/images/favorite_color.gif"/>"/>&nbsp;My Favorites</span>
      </a>
  </c:when>
  <c:otherwise>
      <a href="<c:url value="/showFavorite.do"/>"
         title="Store IDs for easy access to their details page. You can add IDs *only* from the details page, one at a time."
        ><span><img style="vertical-align:middle" height="20" 
              src="<c:url value="/wdk/images/favorite_color.gif"/>"/>&nbsp;My Favorites</span>
      </a>
  </c:otherwise>
</c:choose>
</li>
