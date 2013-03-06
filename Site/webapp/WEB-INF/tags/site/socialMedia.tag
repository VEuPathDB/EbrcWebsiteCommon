<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core">

  <!-- JSP constants -->
  <jsp:useBean id="constants" class="org.eupathdb.common.model.JspConstants"/>

  <!-- set default facebook and twitter IDs (can be overridden in model properties) -->
  <c:set var="facebook" value="${applicationScope.wdkModel.properties['FACEBOOK_ID']}" />
  <c:set var="twitter" value="${applicationScope.wdkModel.properties['TWITTER_ID']}" />
  <c:if test="${empty facebook}">
    <c:set var="facebook" value="pages/EuPathDB/133123003429972"/>
  </c:if>
  <c:if test="${empty twitter}">
    <c:set var="twitter" value="EuPathDB"/>
  </c:if>

  <!-- store the links in the DOM so they are reachable via nav.js functions, -->
  <!--   called from smallMenu, sidebar community, menubar community etc.     -->
  
  <li class="socmedia-link no-divider">
    <span id="twitter-link" style="display:none">http://twitter.com/${twitter}</span>
    <a href="javascript:gotoTwitter()">
      <span class="twitter" title="Follow us on Twitter!"><jsp:text/></span>
    </a>
  </li>
  <li class="socmedia-link no-divider">
    <span id="facebook-link" style="display:none">https://facebook.com/${facebook}</span>
    <a href="javascript:gotoFacebook()">
      <span class="facebook" title="Follow us on Facebook!"><jsp:text/></span>
    </a>
  </li>
  <li class="socmedia-link no-divider">
    <span id="youtube-link" style="display:none">http://www.youtube.com/user/EuPathDB/videos?sort=dd&amp;flow=list&amp;view=1</span>
    <a href="${constants.youtubeUrl}">
      <span class="youtube" title="Follow us on YouTube!"><jsp:text/></span>
    </a>
  </li>

</jsp:root>
