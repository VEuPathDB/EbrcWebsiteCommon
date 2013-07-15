<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="pg" uri="http://jsptags.com/tags/navigation/pager" %>
<%@ taglib prefix="wdk" tagdir="/WEB-INF/tags/wdk" %>
<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>

<%@ attribute name="strategy"
              type="org.gusdb.wdk.model.jspwrap.StrategyBean"
              required="true"
              description="Strategy bean we are looking at"
%>
<%@ attribute name="step"
              type="org.gusdb.wdk.model.jspwrap.StepBean"
              required="true"
              description="Step bean we are looking at"
%>

<c:set var="wdkAnswer" value="${step.answerValue}"/>
<c:set var="questionName" value="${wdkAnswer.question.name}" />

<wdk:resultSummary strategy="${strategy}" step="${step}" />

<c:if test="${fn:contains(questionName, 'TextSearch')}">
  <c:set var="message" value="${wdkAnswer.resultMessage}" />
  <c:if test="${message != null}">
    <div class="result-message ui-state-default ui-corner-all">
      ${message}
    </div>
  </c:if>
</c:if>
