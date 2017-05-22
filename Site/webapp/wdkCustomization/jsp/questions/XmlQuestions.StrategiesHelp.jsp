<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<%-- get wdkXmlAnswer saved in request scope --%>
<c:set var="xmlAnswer" value="${requestScope.wdkXmlAnswer}"/>
<c:set var="wdkModel" value="${applicationScope.wdkModel}"/>

<imp:pageFrame title="${wdkModel.displayName} : Did You Know">

  <div id="strategyTips">

    <%-- handle empty result set situation --%>
    <c:choose>
      <c:when test='${xmlAnswer.resultSize == 0}'>
        Not available.
      </c:when>
      <c:otherwise>

        <!-- main body start -->

        <div>
          <c:set var="i" value="0"/>

          <c:forEach items="${xmlAnswer.recordInstances}" var="record">
            <hr color="#D0D0D0">
            <c:set var="title" value="${record.attributesMap['title']}"/>
            <c:set var="text" value="${record.attributesMap['body']}"/>
            <c:set var="image" value="${record.attributesMap['image']}"/>
            <c:set var="showTip" value="${record.attributesMap['showTipAsDidYouKnow']}"/>
            <c:set var="tip" value="${record.attributesMap['tip']}"/>
            <%--    <b id="strat_help_${i}" class="strat_help_title">${title}</b> --%>

            <div class="h3left" id="strat_help_${i}"> Did you know... </div>

            <c:if test="${showTip}">
              <span id="tip_${i}">
                <div style="margin: 10px 15px 15px;">
                  <p>
                    <b>...${tip}</b>&nbsp;
                    <a href="#strat_help_${i}">Learn more...</a> 
                  </p>
                </div>
              </span>
            </c:if>

            <br><br>${text}
            <br><c:if test="${image != null && image != ''}"><imp:image src="${image}" alt=""/></c:if>

            <c:set var="i" value="${i+1}"/>
          </c:forEach>

        </div>
        <!-- main body end -->

      </c:otherwise>
    </c:choose>

  </div>
</imp:pageFrame>
