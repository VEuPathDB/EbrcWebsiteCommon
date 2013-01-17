<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
    xmlns:jsp="http://java.sun.com/JSP/Page"
    xmlns:c="http://java.sun.com/sjp/jstl/core"
    xmlns:imp="urn:jsptagdir:/WEB-INF/tags/imp">
  <jsp:directive.page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"/>
  <imp:pageFrame title="${wdkModel.displayName} :: Help" refer="help">
    <div style="padding: 1em;">
      <h1>Thank you for your feedback!</h1>
      <p style="text-align:center"><a href="#" onclick="window.close()">Close this window</a></p>

      <div style="text-align:center; margin-top:1em;">
        <p>YOUR MESSAGE HAS BEEN SENT TO THE ${wdkModel.displayName} TEAM.</p>
        <p>A copy has been sent to the email provided, for your records.</p>
      </div>
    </div>
  </imp:pageFrame>
</jsp:root>
