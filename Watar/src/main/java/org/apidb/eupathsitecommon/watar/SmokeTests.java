package org.apidb.eupathsitecommon.watar;

import com.gargoylesoftware.htmlunit.*;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

import java.net.URL;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

public class SmokeTests {

  static final WebClient browser;
  public String baseUrl;
  public String webAppName;

  static {
    browser = new WebClient();
    browser.getOptions().setThrowExceptionOnFailingStatusCode(false);
    browser.getOptions().setJavaScriptEnabled(false);
    if (Integer.getInteger("msTimeout") != null)
      browser.getOptions().setTimeout(Integer.getInteger("msTimeout"));
    System.out.println("browser timeout " + browser.getOptions().getTimeout());
  }

  public SmokeTests() {
    baseUrl = System.getProperty("baseurl");
    webAppName = System.getProperty("webappname");
  }

  /**
   * the home page for EuPathDB portal may depend on functionality of component
   * websites, and those may be offline for rebuild. So it's an unreliable test
   * for deployment. Use _test.jsp instead.
   **/
  @Test(description = "Assert HTTP header status is 200 OK for home page.", groups = {
    "_" })
  public void HomePage_HttpHeaderStatusIsOK() throws Exception {
    var url = baseUrl + "/" + webAppName + "/";
    assertHeaderStatusMessageIsOK(url);
  }

  @Test(description = "Assert HTTP header status is 200 OK for _test.jsp page.", groups = {
    "deployment" })
  public void TestJsp_HttpHeaderStatusIsOK() throws Exception {
    var url = baseUrl + "/" + webAppName + "/wdk/jsp/_test.jsp";
    assertHeaderStatusMessageIsOK(url);
  }

  @Test(description = "Assert HTTP header status is 200 OK for WsfService url as test of Axis installation.", groups = {
    "webservice" })
  public void WsfServicePage_HttpHeaderStatusIsOK() throws Exception {
    var url = baseUrl + "/" + webAppName + Utilities.WSF_PATH;
    assertHeaderStatusMessageIsOK(url);
  }

  @Test(description = "Assert HTTP header status is 200 OK for News url as test of valid XML record.", groups = {
    "xmlrecord" })
  public void News_HttpHeaderStatusIsOK() throws Exception {
    var url = baseUrl + "/" + webAppName + Utilities.NEWS_PATH;
    assertHeaderStatusMessageIsOK(url);
  }

  @Test(description = "Assert HTTP header status is 200 OK for Methods url as test of valid XML record.", groups = {
    "xmlrecord" })
  public void Methods_HttpHeaderStatusIsOK() throws Exception {
    var url = baseUrl + "/" + webAppName + Utilities.METHODS_PATH;
    assertHeaderStatusMessageIsOK(url);
  }

  @Test(description = "Assert HTTP header status is 200 OK for GeneRecord page.", groups = {
    "wdkrecord" }, dataProvider = "defaultGeneId", dependsOnMethods = {
    "HomePage_HttpHeaderStatusIsOK" })
  public void GeneRecordPage_HttpHeaderStatusIsOK(String geneId)
  throws Exception {
    if (geneId == null)
      throw new Exception("unable to get gene id for testing");
    var url = baseUrl
      + "/"
      + webAppName
      + Utilities.GENE_RECORD_PATH_TMPL
      + geneId;
    assertHeaderStatusMessageIsOK(url);
  }

  @Test(description = "Assert valid JSON from /dashboard/json API.", groups = {
    "dashboard" })
  public void Dashboard_JsonApiIsValid() throws Exception {
    var url = baseUrl + "/dashboard/json";
    var page = browser.getPage(url);
    var response = page.getWebResponse();
    assertEquals(response.getStatusMessage(), "OK",
      "Wrong HTTP Status for " + url + " .");
    assertEquals(response.getContentType(), "application/json",
      "Content-Type is 'application/json'");
    var pageSource = response.getContentAsString();
    assertTrue(pageSource.contains("\"wdk\":"), "JSON contains '\"wdk\"'");
  }

  @Test(description = "Assert valid XML from /dashboard/xml API.", groups = {
    "dashboard" })
  public void Dashboard_XmlApiIsValid() throws Exception {
    var url = baseUrl + "/dashboard/xml";
    var page = browser.getPage(url);
    var response = page.getWebResponse();
    assertEquals(response.getStatusMessage(), "OK",
      "Wrong HTTP Status for " + url + " .");
    assertEquals(response.getContentType(), "text/xml",
      "Content-Type is 'text/xml'");
    var pageSource = response.getContentAsString();
    assertTrue(pageSource.contains("<wdk>"), "XML contains '<wdk>'");
  }

  /**
   * Returns the default value from the Gene ID Quick Search form on the front
   * page.
   **/
  @DataProvider(name = "defaultGeneId")
  private Object[][] getDefaultGeneIdFromQuickSearchForm() throws Exception {
    try {
      var url = baseUrl + "/";
      var request = new WebRequest(new URL(url), HttpMethod.GET);
      var page = (HtmlPage) browser.getPage(request);
      for (var element : page.getElementsByTagName("input")) {
        if (element.getAttribute("name").contains("single_gene_id"))
          return new Object[][] { { element.getAttribute("value") } };
      }
      return null;
    }
    catch (Exception e) {
      e.printStackTrace();
      throw e;
    }

  }

  /**
   * Assert HEAD request returns 200 OK for the given url.
   **/
  private void assertHeaderStatusMessageIsOK(String url) throws Exception {

    try {
      var request = new WebRequest(new URL(url), HttpMethod.HEAD);
      var page = browser.getPage(request);
      var response = page.getWebResponse();
      assertEquals(response.getStatusMessage(), "OK",
        "Wrong HTTP Status for " + url + " .");
    }
    catch (Exception e) {
      e.printStackTrace();
      throw e;
    }
  }
}
