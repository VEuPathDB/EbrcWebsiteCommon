<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:jsp="http://java.sun.com/JSP/Page"
  xmlns:c="http://java.sun.com/jsp/jstl/core"
  xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">
  <jsp:directive.page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"/>

  <!-- get wdkXmlAnswer saved in request scope -->
  <c:set var="xmlAnswer" value="${requestScope.wdkXmlAnswer}"/>

  <!-- display page header with xmlquestion display in banner -->
  <imp:pageFrame title="${xmlAnswer.question.displayName}">
    <c:choose>
      <c:when test='${xmlAnswer.resultSize == 0}'>

        <!-- handle empty result set situation -->
        Not available.

      </c:when>
      <c:otherwise>

        <!-- main body start -->
        <table border="0" cellpadding="2" cellspacing="0" width="100%">
          <c:set var="i" value="0"/>
          <c:forEach items="${xmlAnswer.recordInstances}" var="record">
            <c:set var="rowColor" value="${i % 2 eq 0 ? 'rowLight' : 'rowDark'}"/>
            <tr class="${rowColor}">
              <td>
                <table>
                  <c:forEach items="${record.attributes}" var="recAttr"> 
                    <tr>
                      <c:set var="attrName" value="${recAttr.name}"/>
                      <c:set var="attrVal" value="${recAttr.value}"/>
                      <td width="1" nowrap="" align="right"><b>${attrName}:</b></td>
                      <td>
                        <!-- need to know if fieldVal should be hot linked -->
                        <c:choose>
                          <c:when test="${attrName eq 'link' or attrName eq 'url'}">
                            <a href="${attrVal}">${attrVal}</a>
                          </c:when>
                          <c:otherwise>
                            ${attrVal}
                          </c:otherwise>
                        </c:choose>
                      </td>
                    </tr>
                  </c:forEach>
                </table>
              </td>
            </tr>
            <c:set var="i" value="${i+1}"/>
          </c:forEach>
        </table>
        <!-- main body end -->

      </c:otherwise>
    </c:choose>
  </imp:pageFrame>
</jsp:root>
