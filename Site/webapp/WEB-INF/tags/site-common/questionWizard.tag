<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:jsp="http://java.sun.com/JSP/Page"
  xmlns:fn="http://java.sun.com/jsp/jstl/functions"
  xmlns:c="http://java.sun.com/jsp/jstl/core">

  <jsp:directive.attribute name="question" required="true" description="WDK Question"
    type="org.gusdb.wdk.model.jspwrap.QuestionBean"/>

  <jsp:directive.attribute name="step" required="true" description="WDK Step"
    type="org.gusdb.wdk.model.jspwrap.StepBean"/>

  <jsp:directive.attribute name="strategy" required="true" description="WDK Strategy"
    type="org.gusdb.wdk.model.jspwrap.StrategyBean"/>

  <c:set var="questionParamValues">
    {
    <c:forEach items="${question.params}" var="questionParam" varStatus="loop">
      "${questionParam.name}": "${fn:replace(questionParam.stableValue, '"', '\\"')}" <c:if test="${loop.last eq false}">,</c:if>
    </c:forEach>
    }
  </c:set>

  <c:set var="customName" value="${empty step ? '' : step.customName}"/>

  <div
    data-question-full-name="${question.fullName}"
    data-custom-name="${customName}"
    data-param-values-container-selector=".param-values"
    data-controller="ebrc.controllers.wizard"
  >
    <textarea class="param-values" style="display: none">
      ${fn:escapeXml(questionParamValues)}
    </textarea>
  </div>

</jsp:root>
