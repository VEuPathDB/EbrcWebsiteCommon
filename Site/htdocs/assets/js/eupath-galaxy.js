// Title content
document.getElementById("eupath-title").innerHTML = "" +
        "Welcome to the EuPathDB Galaxy Site!";

// Subtitle content
document.getElementById("eupath-subtitle").innerHTML = "" +
        "Free, interactive, web-based platform for large-scale data analysis";

// Introductory paragraph content
document.getElementById("eupath-intro").innerHTML = "" +
		"EuPathDB Galaxy workspaces require no prior knowledge of programming or bioinformatics experience." +
		" This Galaxy instance integrates bioinformatics algorithms and tools into an easy to use interactive platform" +
		" that offers pre-loaded annotated genomes and workflows to help you perform large-scale data analysis. You can also" +
		" upload your own data, compose and run custom workflows, retrieve results and share your workflows and data" +
		" analyses with colleagues.";

// Links content
/*
document.getElementById("eupath-links").innerHTML = "" +
        "<li><a href='#'>Link A</a></li>" +
		"<li><a href='#'>Link B</a></li>" +
		"<li><a href='#'>Link C</a></li>";
*/

// Workflows content
// Warning insure ids inside onClick events are correct for galaxy site to which this is deployed. 
document.getElementById("eupath-workflows").innerHTML = "" +
	"<tr><td title=\"click to run the workflow\" class=\"notice_table_name\"><a id='workflow1' href='javascript:void(0)' onClick='import_and_run_workflow(\"3eff99ce50c5e7b3\")'>EuPathDB Workflow for Illumina paired-end RNA-seq, single replicate</a></td></tr>" +
        "<tr><td>Profile a transcriptome and analyze differential gene expression, splicing, and promoter use (Plasmodium falciparum).<br>Tools: FastQC, GSNAP, CuffLinks, CuffDiff.<br><br></td></tr>" +
        "<tr><td title=\"not ready\" class=\"notice_table_name\">EuPathDB Workflow for Illumina paired-end RNA-seq, biological replicates</td></tr>" +
        "<tr><td>Profile a transcriptome and analyze differential gene expression (Aspergillus nidulans).</td></tr>";
 

/**
 * A series of ajax calls to import a published workflow (if not already imported) and get its id,
 * followed by a redirect to run the imported workflow
 * @param id - the published (shared) workflow to import
 */
import_and_run_workflow = function(id) {
  var base_url = location.protocol + "//" + location.host;
  var import_id = "";
  // First ajax call to get the name of the workflow to import
  jQuery.get(base_url + "/api/workflows/" + id, function (result) {
    var name = result.name;
    // Second ajax call to determine if the workflow was already imported.
    jQuery.get(base_url + "/api/workflows", function (results) {
      for(i = 0; i < results.length; i++) {
        if(results[i].name.startsWith("imported: ") && results[i].name.endsWith(name)) {
          import_id = results[i].id;
          break;
        }
      }
      // If no import exists issue a third ajax call to actually import the workflow
      if(import_id.length == 0) {
        jQuery.post(base_url + "/api/workflows/import",{"workflow_id":id},function(id) {
          // Fourth ajax call to find the newly imported workflow based upon the 'imported: '
          // key phrase, followed by the name of the original workflow
          jQuery.get(base_url + "/api/workflows", function (results) {
            for(i = 0; i < results.length; i++) {
              if(results[i].name.startsWith("imported: ") && results[i].name.endsWith(name)) {
                import_id = results[i].id;
                break;
              }
            }  
            // If the id of the imported workflow is (hopefully always) found, redirect to the
            // url that runs that workflow.
            if(import_id.length > 0) {
              location.href = "/workflow/run?id=" + import_id;
            }
          });
        });
      }
      // Import already exists.  Just run it.
      else {
        location.href = "/workflow/run?id=" + import_id;
      }    
    });
  });  
}




