<?xml version="1.0" encoding="UTF-8"?>
<jsp:root version="2.0"
  xmlns:jsp="http://java.sun.com/JSP/Page">

  <jsp:directive.attribute name="refer" required="false" 
    description="Page calling this tag"/>

  <jsp:directive.attribute name="title" required="false" 
    description="Title of page"/>

  <header data-controller="eupath.setup.header">
    <div id="header"><jsp:text/></div>
  </header>

</jsp:root>
