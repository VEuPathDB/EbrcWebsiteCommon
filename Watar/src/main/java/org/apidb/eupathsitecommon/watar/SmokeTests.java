package org.apidb.eupathsitecommon.watar;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

import java.net.URL;

import org.testng.annotations.Test;

import com.gargoylesoftware.htmlunit.HttpMethod;
import com.gargoylesoftware.htmlunit.Page;
import com.gargoylesoftware.htmlunit.UnexpectedPage;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.WebRequest;
import com.gargoylesoftware.htmlunit.WebResponse;
import com.gargoylesoftware.htmlunit.html.HtmlPage;

public class SmokeTests {

    static final int HTTP_RESPONSE_OK = 200;
    static final WebClient browser;

    public String baseurl;
    public String webappname;
    public boolean isPortal;
    
    static {
        browser = new WebClient();
        browser.getOptions().setThrowExceptionOnFailingStatusCode(false);
        browser.getOptions().setJavaScriptEnabled(false);
        if (Integer.getInteger("msTimeout") != null)
          browser.getOptions().setTimeout(Integer.getInteger("msTimeout"));
        System.out.println("browser timeout " + browser.getOptions().getTimeout());
    }

    public SmokeTests() {

      baseurl = System.getProperty("baseurl");
      webappname = System.getProperty("webappname");
      isPortal = baseurl.toLowerCase().contains("eupathdb");
    }

    @Test(description="Assert HTTP header status is 200 OK for WsfService url as test of Axis installation.",
          groups = { "deployment" })
    public void WsfServicePage_HttpHeaderStatusIsOK() throws Exception {
        String url = baseurl + "/" + webappname + Utilities.WSF_PATH;
        assertJsonStatusMessageIsOK(url);
        //assertHeaderStatusMessageIsOK(url);
    }


    
    
/**
    @Test(description="Assert HTTP header status is 200 OK for GeneRecord page.",
          groups = { "wdkrecord" },
          dataProvider="defaultGeneId",
          dependsOnMethods={"HomePage_HttpHeaderStatusIsOK"})
    public void GeneRecordPage_HttpHeaderStatusIsOK(String geneId) throws Exception {
        if (geneId == null) throw new Exception("unable to get gene id for testing");
        String url = baseurl + "/" + webappname + Utilities.GENE_RECORD_PATH_TMPL + geneId;
        if(!isPortal) {
          assertHeaderStatusMessageIsOK(url);
        }   
    }
**/


    @Test(description="Assert valid JSON from /dashboard/json API.", 
          groups = { "dashboard" })
    public void Dashboard_JsonApiIsValid() throws Exception {
        String url = baseurl + "/dashboard/json";
        Page page = browser.getPage(url);
        WebResponse response = page.getWebResponse();
        assertEquals(response.getStatusMessage(), "OK",  "Wrong HTTP Status for " + url + " .");
        assertTrue(response.getContentType().equals("application/json"), "Content-Type is 'application/json'");
        String pageSource = response.getContentAsString();
        assertTrue(pageSource.contains("\"wdk\":"), "JSON contains '\"wdk\"'");

    }

    @Test(description="Assert valid XML from /dashboard/xml API.", 
          groups = { "dashboard" })
    public void Dashboard_XmlApiIsValid() throws Exception {
        String url = baseurl + "/dashboard/xml";
        Page page = browser.getPage(url);
        WebResponse response = page.getWebResponse();
        assertEquals(response.getStatusMessage(), "OK",  "Wrong HTTP Status for " + url + " .");
        assertTrue(response.getContentType().equals("text/xml"), "Content-Type is 'text/xml'");
        String pageSource = response.getContentAsString();
        assertTrue(pageSource.contains("<wdk>"), "XML contains '<wdk>'");
    }

    /** 
     * Returns the default value from the Gene ID Quick Search form on the front page.
   **/

    /**
    @DataProvider(name="defaultGeneId")
   private Object[][] getDefaultGeneIdFromQuickSearchForm() throws Exception {
     try {
       String url = baseurl + "/" + webappname + Utilities.GENE_ID_SEARCH;
       WebRequest request = new WebRequest(new URL(url), HttpMethod.GET);
       HtmlPage page = (HtmlPage) browser.getPage(request);

       for (HtmlForm form : page.getForms()) {
         if (form.getNameAttribute().contentEquals("questionForm")) {
           HtmlTextArea contentArea = form.getTextAreaByName("ds_gene_ids_data");
           String defaultGene = contentArea.getText();
             return new Object[][] {{ defaultGene }};
         }
       }
       return null;
       } catch (Exception e) {
           e.printStackTrace();
           throw e;
       }
   
   }
**/
   
   
    /** 
      * Assert HEAD request returns 200 OK for the given url.
    **/
    @SuppressWarnings("unused") // may need later
    private void assertHeaderStatusMessageIsOK(String url) throws Exception {

        try {
            WebRequest request = new WebRequest(new URL(url), HttpMethod.HEAD);
            HtmlPage page = (HtmlPage) browser.getPage(request);
            WebResponse response = page.getWebResponse();
            //assertEquals(response.getStatusMessage(), "OK",  "Wrong HTTP Status for " + url + " .");
            assertEquals(response.getStatusCode(), HTTP_RESPONSE_OK,  "Wrong Status " + response.getStatusMessage() + " for " + url + " .");
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
   
    }

    /** 
     * Assert request returns 200 OK for the given json url
   **/
   private void assertJsonStatusMessageIsOK(String url) throws Exception {

       try {
           WebRequest request = new WebRequest(new URL(url), HttpMethod.HEAD);
           request.setAdditionalHeader("Content-type", "application/json");
           UnexpectedPage page = (UnexpectedPage) browser.getPage(request);
           WebResponse response = page.getWebResponse();
           assertEquals(response.getStatusCode(), HTTP_RESPONSE_OK,  "Wrong Status " + response.getStatusMessage() + " for " + url + " .");
       } catch (Exception e) {
           e.printStackTrace();
           throw e;
       }
  
   }

}
