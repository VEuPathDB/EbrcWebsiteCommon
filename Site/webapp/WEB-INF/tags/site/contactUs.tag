<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/jsp/jstl/core">
    
  <c:set var="siteName" value="${applicationScope.wdkModel.name}"/>
  <c:set var="referrer" value="${header['referer']}"/>
  
<h1>We appreciate your questions and feedback</h1>


  <div class="contact-us">
    <h4>
      We are available to help with
      <span class="underline">Questions</span>,
      <span class="underline">Error reports</span>,
      <span class="underline">Feature requests</span>,
      <span class="underline">Dataset proposals</span>,
      etc.
    </h4>

    <!--
    <p>Please include (but all are optional):
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
            <li>Which other browsers have you tried?</li>
            <li>Have you cleared your cache/cookies?</li>
          </ul>
        </li>
      </ul>
    </p>
    -->

    <form id="contact-us" method="post" enctype="multipart/form-data"
        action="${pageContext.request.contextPath}/contactUs.do">
        <input type="hidden" name="referrer" value="${referrer}"/>
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
          <td><input type="text" name="addCc" value="" size="81"/>
            <p class="info">(maximum 10 Cc addresses, comma separated.)</p>
          </td>
        </tr>
        <tr>
          <td valign="top"><b>Message:</b></td>
          <td>
            <textarea name="content" cols="75" rows="8"><jsp:text/></textarea>
            <div class="wdk-toggle info">
              <h3>Useful information when reporting a problem</h3>
              <div>
                The following details will help us determine the cause more quickly:
                <ul>
                  <li>The <b>URL</b> of the offending page</li>
                  <li>
                    <b>Exact steps</b> to recreate the problem.
                    <br/><i>(If possible, please try to recreate the problem
                      yourself so you can give us an exact recipe.)</i>
                  </li>
                  <li>The full <b>error message</b>, if any.</li>
                  <li>Any other <b>web browsers</b> have you tried.</li>
                  <li>If you <b>cleared your cache and/or cookies</b>.</li>
                </ul>
              </div>
            </div>
          </td>
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
          <td colspan="2" align="center">
            <input type="submit" value="Submit message"/>
            <p class="center info">All fields are optional, except for <b>Message</b>.</p>
          </td>

        </tr>
      </table>
    </form>

  </div>
</jsp:root>
