<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core"
    xmlns:fmt="http://java.sun.com/jsp/jstl/fmt"
    xmlns:fn="http://java.sun.com/jsp/jstl/functions"
    xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">
  
  <jsp:directive.attribute name="refer" required="false" 
              description="Page calling this tag"/>
  
  <c:set var="siteName" value="${applicationScope.wdkModel.name}" />
  <c:set var="version" value="${applicationScope.wdkModel.version}" />
  <fmt:setLocale value="en-US"/> <!-- req. for date parsing when client browser (e.g. curl) does not send locale -->
  <fmt:parseDate  var="releaseDate" value="${applicationScope.wdkModel.releaseDate}" pattern="dd MMMM yyyy HH:mm"/> 
  <fmt:formatDate var="releaseDate_formatted" value="${releaseDate}" pattern="d MMM yy"/>
  <fmt:formatDate var="copyrightYear" value="${releaseDate}" pattern="yyyy"/>
  
  <c:set var="footerClass" value="${refer eq 'home' or refer eq 'home2' ? 'skinny-footer' : 'wide-footer' }"/>

  <div id="footer" class="${footerClass} ui-helper-clearfix">
    <div class="left">
      <div class="build-info">
        <a href="http://${fn:toLowerCase(siteName)}.org">${siteName}</a> ${version}
        <span class="release">${releaseDate_formatted}</span><br/>
      </div>
      <div class="copyright">&amp;copy;${copyrightYear} The EuPathDB Project Team</div>
    </div>

    <div class="right">
      <div class="contact">
        Please <a href="${pageContext.request.contextPath}/contact.do"
            class="new-window" data-name="contact_us">Contact Us</a> with any questions or comments
      </div>
      <ul class="attributions">
        <li>
          <a href="http://code.google.com/p/strategies-wdk/">
            <imp:image border="0" src="wdk/images/stratWDKlogo.png" width="120"/>
          </a>
        </li>
        <!-- <li>Test attribution</li> -->
      </ul>
    </div>

    <div class="bottom">
      <a href="http://www.eupathdb.org">
        <img src="/assets/images/eupathdblink.png" alt="Link to EuPathDB homepage"/>
      </a>

      <ul class="site-icons">
        <li title="AmoebaDB.org">
          <a href="http://amoebadb.org">
            <img src="/assets/images/AmoebaDB/footer-logo.png"/>
          </a>
        </li>
        <li class="short-space" title="CryptoDB.org">
          <a href="http://cryptodb.org">
            <img src="/assets/images/CryptoDB/footer-logo.png"/>
          </a>
        </li>
        <li class="short-space" title="GiardiaDB.org">
          <a href="http://giardiadb.org">
            <img src="/assets/images/GiardiaDB/footer-logo.png"/>
          </a>
        </li>
        <li class="long-space" title="MicrosporidiaDB.org">
          <a href="http://microsporidiadb.org">
            <img src="/assets/images/MicrosporidiaDB/footer-logo.png"/>
          </a>
        </li>
        <li class="short-space" title="PiroplasmaDB.org">
          <a href="http://piroplasmadb.org">
            <img src="/assets/images/PiroplasmaDB/footer-logo.png"/>
          </a>
        </li>
        <li class="long-space" title="PlasmoDB.org">
          <a href="http://plasmodb.org">
            <img src="/assets/images/PlasmoDB/footer-logo.png"/>
          </a>
        </li>
        <li class="long-space" title="ToxoDB.org">
          <a href="http://toxodb.org">
            <img src="/assets/images/ToxoDB/footer-logo.png"/>
          </a>
        </li>
        <li class="short-space" title="TrichDB.org">
          <a href="http://trichdb.org">
            <img src="/assets/images/TrichDB/footer-logo.png"/>
          </a>
        </li>
        <li class="short-space" title="TriTrypDB.org">
          <a href="http://tritrypdb.org">
            <img src="/assets/images/TriTrypDB/footer-logo.png"/>
          </a>
        </li>
        <li class="short-space" title="OrthoMCL.org">
          <a href="http://orthomcl.org">
            <img src="/assets/images/OrthoMCL/footer-logo.png"/>
          </a>
        </li>
      </ul>
    </div>

  </div>
  
</jsp:root>
