<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core">
    
	<c:set var="siteName" value="${applicationScope.wdkModel.name}"/>
	
	<div class="contact-us">
	  <p>
	    We are available to help with <b>Questions</b>, <b>Error reports</b>,
	    <b>Feature requests</b>, <b>Dataset proposals</b>, etc.
	    Please include (but all are optional):
	  </p>
	  <div class="cirbulletlist">
	    <ul>
	      <li>Your email, so we can respond.</li>
	      <li>If you are describing a problem, <i>details</i> of how the problem occurred, including:
	        <ul>
	          <li>The URL of the offending page</li>
	          <li>
	            <i>Exact</i> steps to recreate the problem. If possible, please
	            try to recreate the problem yourself so you can give us an exact recipe.
	          </li>
	          <li>The full error message, if any.</li>
	        </ul>
	      </li>
	    </ul>
	  </div>
	  <form id="contact-us" method="post" enctype="multipart/form-data"
        action="${pageContext.request.contextPath}/contactUs.do">
		  <table>
		    <tr>
		      <td><b>Subject:</b></td>
		      <td><input type="text" name="subject" size="81"/></td>
		    </tr>
		    <tr>
		      <td><b>Your email address:</b></td>
		      <td><input type="text" name="reply" size="81"/></td>
		    </tr>
		    <tr>
          <td><b>Cc addresses:</b></td>
		      <td><input type="text" name="addCc" value="" size="81"/></td>
		    </tr>
		    <tr>
		      <td></td>
		      <td><i>(maximum 10 Cc addresses, comma separated.)</i></td>
		    </tr>
		    <tr>
		      <td valign="top"><b>Message:</b></td>
		      <td>
		        <textarea name="content" cols="75" rows="8"><jsp:text/></textarea>
		      </td>
		    </tr>
        <tr>
          <td></td>
          <td></td>
        </tr>
		    <tr>
          <td><b>Attachments:</b></td>
          <td>Optionally, attach up to three screenshots to your message (maximum 5Mb per file).<br/>
            <br/>
            <div id="contact-files">
              <div><input type="file" name="attachment1"/> </div>
            </div>
          </td>
		    </tr>
        <tr>
          <td></td>
          <td></td>
        </tr>
		    <tr>
		      <td></td>
		      <td align="left"><input type="submit" value="Submit message"/></td>
		    </tr>
		  </table>
	  </form>
    <!--
	  <div>
	    <b>If you would like to attach a screenshot, please email directly to <a href="mailto:help@${siteName}.org">help@${siteName}.org</a>.</b>
	  </div>
    -->
	</div>
</jsp:root>
