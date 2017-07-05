<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp"
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

  <c:set var="customName" value="${empty step or step.customName eq step.shortDisplayName ? '' : step.customName}"/>

  <div
    data-question-full-name="${question.fullName}"
    data-custom-name="${customName}"
    data-param-values-container-selector=".param-values"
    data-show-help-text="${empty step}"
    data-controller="ebrc.controllers.wizard"
  >
    <textarea class="param-values" style="display: none">
      ${fn:escapeXml(questionParamValues)}
    </textarea>
  </div>

  <c:if test="${step ne null}">
    <c:if test="${step.previousStep != null || action != 'revise'}">
      <div class="filter operators">
        <c:set var="newStepId">
          <c:choose>
            <c:when test="${action == 'add'}">${wdkStep.frontId + 1}</c:when>
            <c:otherwise>${wdkStep.frontId}</c:otherwise>
          </c:choose>
        </c:set>
        <c:set var="currentStepId" value="${newStepId - 1}" />

        <c:if test="${step.previousStep ne null and action eq 'revise'}">
          <c:set var="step" value="${step.previousStep}" />
        </c:if>
        <span class="h2center">Combine ${step.recordClass.displayNamePlural} in Step <span class="current_step_num">${currentStepId}</span> with ${wdkQuestion.recordClass.displayNamePlural} in Step <span class="new_step_num">${newStepId}</span>:</span>

        <div style="text-align:center" id="operations">
          <imp:operators  allowSpan="${allowSpan}"
            operation="${param.operation}"
            spanStage="span_from_question"
          />
        </div>
      </div>
    </c:if>
  </c:if>

</jsp:root>
