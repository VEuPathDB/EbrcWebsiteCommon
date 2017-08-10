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
  <c:set var="isAddingStep" value="${step ne null and (step.previousStep ne null or action ne 'revise')}"/>

  <!-- Show step operations if this is a step -->
  <c:if test="${step ne null}">
    <c:if test="${isAddingStep}">
      <div style="padding: 1em">
        <c:set var="newStepId">
          <c:choose>
            <c:when test="${action == 'add'}">${step.frontId + 1}</c:when>
            <c:otherwise>${step.frontId}</c:otherwise>
          </c:choose>
        </c:set>
        <c:set var="currentStepId" value="${newStepId - 1}" />

        <c:if test="${step.previousStep ne null and action eq 'revise'}">
          <c:set var="step" value="${step.previousStep}" />
        </c:if>

        <div style="font-size: 1.2em; font-weight: 500;">
          Your Step ${currentStepId} found ${step.estimateSize} Participants.  To combine it with a new search, choose a combine operation, then specify the new search.
        </div>

        <div style="text-align:center" id="operations">
          <imp:operators  allowSpan="${allowSpan}"
            operation="${param.operation}"
            spanStage="span_from_question"
          />
        </div>

        <hr/>

      </div>
    </c:if>
  </c:if>

  <div
    data-question-full-name="${question.fullName}"
    data-custom-name="${customName}"
    data-param-values-container-selector=".param-values"
    data-is-revise="${action eq 'revise'}"
    data-is-adding-step="${isAddingStep}"
    data-controller="ebrc.controllers.wizard"
  >
    <textarea class="param-values" style="display: none">
      ${fn:escapeXml(questionParamValues)}
    </textarea>
  </div>

</jsp:root>
