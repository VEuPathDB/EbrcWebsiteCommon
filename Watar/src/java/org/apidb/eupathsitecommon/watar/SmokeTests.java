package org.apidb.eupathsitecommon.watar;

import com.gargoylesoftware.htmlunit.html.HtmlElement;
import com.gargoylesoftware.htmlunit.html.DomElement;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import com.gargoylesoftware.htmlunit.html.HtmlTextInput;
import com.gargoylesoftware.htmlunit.HttpMethod;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.WebRequest;
import com.gargoylesoftware.htmlunit.WebResponse;

import java.net.URL;

import org.apidb.eupathsitecommon.watar.Utilities;

import org.testng.annotations.*;
import static org.testng.Assert.assertEquals;


public class SmokeTests {

    static final WebClient browser;
    public String baseurl;
    public String webappname;
        
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
    }

    /** the home page for EuPathDB portal may depend on functionality
        of component websites, and those may be offline for rebuild.
        So it's an unreliable test for deployment. Use _test.jsp instead.
    **/
    @Test(description="Assert HTTP header status is 200 OK for home page.",
          groups = { "_" })
    public void HomePage_HttpHeaderStatusIsOK() throws Exception {
        String url = baseurl + "/" + webappname + "/";
        assertHeaderStatusMessageIsOK(url);
    }

    @Test(description="Assert HTTP header status is 200 OK for _test.jsp page.",
          groups = { "deployment" })
    public void TestJsp_HttpHeaderStatusIsOK() throws Exception {
        String url = baseurl + "/" + webappname + "/wdk/jsp/_test.jsp";
        assertHeaderStatusMessageIsOK(url);
    }

    @Test(description="Assert HTTP header status is 200 OK for WsfService url as test of Axis installation.",
          groups = { "webservice" })
    public void WsfServicePage_HttpHeaderStatusIsOK() throws Exception {
        String url = baseurl + "/" + webappname + Utilities.WSF_PATH;
        assertHeaderStatusMessageIsOK(url);
    }

    @Test(description="Assert HTTP header status is 200 OK for News url as test of valid XML record.", 
          groups = { "xmlrecord" })
    public void News_HttpHeaderStatusIsOK() throws Exception {
        String url = baseurl + "/" + webappname + Utilities.NEWS_PATH;
        assertHeaderStatusMessageIsOK(url);
    }

    @Test(description="Assert HTTP header status is 200 OK for Methods url as test of valid XML record.", 
          groups = { "xmlrecord" })
    public void Methods_HttpHeaderStatusIsOK() throws Exception {
        String url = baseurl + "/" + webappname + Utilities.METHODS_PATH;
        assertHeaderStatusMessageIsOK(url);
    }

    @Test(description="Assert HTTP header status is 200 OK for GeneRecord page.",
          groups = { "wdkrecord" },
          dataProvider="defaultGeneId",
          dependsOnMethods={"HomePage_HttpHeaderStatusIsOK"})
    public void GeneRecordPage_HttpHeaderStatusIsOK(String geneId) throws Exception {
        if (geneId == null) throw new Exception("unable to get gene id for testing");
        String url = baseurl + "/" + webappname + Utilities.GENE_RECORD_PATH_TMPL + geneId;
        assertHeaderStatusMessageIsOK(url);
    }

    /** 
      * Returns the default value from the Gene ID Quick Search form on the front page.
    **/
    @DataProvider(name="defaultGeneId")
    private Object[][] getDefaultGeneIdFromQuickSearchForm() throws Exception {
        try {
        String url = baseurl + "/";
        WebRequest request = new WebRequest(new URL(url), HttpMethod.GET);
        HtmlPage page = (HtmlPage) browser.getPage(request);
        for (DomElement element : page.getElementsByTagName("input")) {
            if (element.getAttribute("name").contains("single_gene_id"))
                return new Object[][] {{ element.getAttribute("value") }};
        }
        return null;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
        
    }

    /** 
      * Assert HEAD request returns 200 OK for the given url.
    **/
    private void assertHeaderStatusMessageIsOK(String url) throws Exception {

        try {
            WebRequest request = new WebRequest(new URL(url), HttpMethod.HEAD);
            HtmlPage page = (HtmlPage) browser.getPage(request);
            WebResponse response = page.getWebResponse();
            assertEquals(response.getStatusMessage(), "OK",  "Wrong HTTP Status for " + url + ".");
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
   
    }
}
