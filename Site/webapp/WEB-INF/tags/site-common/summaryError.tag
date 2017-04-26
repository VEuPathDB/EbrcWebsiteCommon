<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>
<%@ taglib prefix="pg" uri="http://jsptags.com/tags/navigation/pager" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="html" uri="http://struts.apache.org/tags-html" %>
<%@ taglib prefix="nested" uri="http://struts.apache.org/tags-nested" %>


<h3 style="margin-left:0">Sorry, there is a problem with the selected strategy.</h3>

<div style="">
  <span style="font-weight:bold">To correct it:</span>
  <ul class="cirbulletlist">
    <li>
      If you see a <span style="color:red">red X</span> or
      <span style="font-weight:bold">a step showing 0</span> results, please
      click on the Edit button, that appears as you mousoever each step, and
      choose 'Revise'. Re-run the step after adjusting parameters as needed.
    </li>
    <li>
      Otherwise, please select each step (click on it) to view its results,
      starting with the leftmost. 'Revise' any step that fails.
    </li>
  </ul>
  <br/>
  <span style="font-weight:bold">If this does not work, please:</span>
  <ul class="cirbulletlist">
    <li>
      Open the <a href="${pageContext.request.contextPath}/contact.do"
        class="new-window" data-name="contact_us">Contact Us</a> form,
    </li>
    <li>
      'Save' the strategy in error and 'Share' it with us in the form,
    </li>
    <li>
      Make a screenshot and upload it in the form,
    </li>
    <li>
      Submit the form!
    </li>
  </ul>
  <br/>
  Thank you!<br/>
  Your EuPathDB team.
</div>
