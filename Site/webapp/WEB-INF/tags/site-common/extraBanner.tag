<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn"  uri="http://java.sun.com/jsp/jstl/functions" %>

<%@ attribute name="refer"
              required="true"
              description="page calling this tag"
%>
<%@ attribute name="title"
              required="false"
              description="record class"
%>
<c:set var="project" value="${wdkModel.name}"/>

<c:if test="${ project ne 'OrthoMCL' && ( refer == 'question' && fn:containsIgnoreCase(title,'BLAST') ) }">
			As of 3 Feb 2014, this search uses NCBI-BLAST to determine sequence similarity. 
			Prior versions of the search used WU-BLAST.
		  <a target="_blank" href="http://www.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Web&PAGE_TYPE=BlastDocs">NCBI-BLAST help.</a>
</c:if>

<%--
<c:if test="${( refer == 'question' && fn:containsIgnoreCase(title,'pathway') ||
				     refer == 'question' && fn:containsIgnoreCase(title,'compound') ||
             refer == 'recordPage' && fn:containsIgnoreCase(title,'pathway') ||
             refer == 'recordPage' && fn:containsIgnoreCase(title,'compound') ) }">

       This <i>beta-release</i> of Compound and Metabolic Pathways data sets incorporates KEGG pathways and a subset of PubChem records.  Future releases will include compounds for additional metabolites and small molecules, and pathways from other sources such as MPMP, MetaCyc, etc.  

       Please explore the site and 
			 <a class="new-window" data-name="contact_us" href="<c:url value='/contact.do'/>" >contact us</a> 
			 with your feedback. 
</c:if>
--%>

<c:if test="${project == 'OrthoMCL'  &&
           ( refer == 'question' && fn:containsIgnoreCase(title,'enzyme') ||
				     refer == 'question' && fn:containsIgnoreCase(title,'compound')  ) }">

Note: the Enzyme Commission (EC) numbers associated with proteins were obtained only from UniProt. In future releases we expect to include EC numbers from multiple sources including the annotation.

</c:if>

<c:if test="${refer == 'home' || refer == 'home2'}">
  <c:set var="homeClass" value="home"/>
</c:if>

<!--
<table><tr><td>
  <imp:image src="images/warningSign.png" alt="warningSign" /></td>
  <td> 
    This ${wdkModel.name} has been significantly upgraded.  
    In addition to a refresh of all data to the latest versions, the site reflects a large development effort to upgrade many website and data features (see the <a href="<c:url value='/showXmlDataContent.do?name=XmlQuestions.News'/> ">Release Notes</a>). 
    Please explore the site and <a class="new-window" data-name="contact_us" href='<c:url value='/contact.do'/>'>
    Contact Us</a> with your feedback. 
    Previous database available at <a href="http://r28.${wdkModel.name}.org">${wdkModel.name} Release 28</a>.
  </td></tr>
</table>
-->

