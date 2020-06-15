package org.apidb.eupathsitecommon.watar;

//import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.Dimension;

import org.testng.annotations.Test;

import org.testng.annotations.BeforeTest;
import org.testng.annotations.AfterTest;
import org.json.JSONArray;
import org.json.JSONObject;

//import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

import java.io.BufferedReader;

import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import org.apidb.eupathsitecommon.watar.pages.HomePage;
import org.apidb.eupathsitecommon.watar.pages.SearchForm;
import org.gusdb.fgputil.json.JsonIterators;

public class SeleniumTests {
  private WebDriver driver;
  //private JavascriptExecutor js;

  private String baseurl;
  
//  private boolean isPortal;

  public SeleniumTests() {
    //String websiteBase = "https://beta.plasmodb.org";
    //String webappName = "plasmo.beta";

    String websiteBase = System.getProperty("baseurl");
    String webappName = System.getProperty("webappname");
    
    this.baseurl = websiteBase + "/" + webappName;
    
    //    isPortal = baseurl.toLowerCase().contains("eupathdb");
    
  }
  
  @BeforeTest
  public void setUp() {
   this.driver = new ChromeDriver();
   driver.manage().window().setSize(new Dimension(1000, 1000));
   //js = (JavascriptExecutor) driver;
  }
  @AfterTest
  public void tearDown() {
   driver.quit();
  }

  @Test(description="Assert home page loads and the featured tool section is there.",
      groups = { "_" })
  public void homePage () {
    driver.get(this.baseurl);
    HomePage homePage = new HomePage(driver);
    homePage.waitForPageToLoad();
    assertTrue(homePage.selectedToolBodyCount() == 1, "assert Selected Tool Body was present");
    String initialSelectedToolText = homePage.selectedToolHeaderText();
    homePage.changeSelectedTool();
    String changedSelectedToolText = homePage.selectedToolHeaderText();
    assertTrue(!initialSelectedToolText.equals(changedSelectedToolText), "assert Selected Tool was Changed");
  }
  
  @Test(description="",
      groups = { "_" })
  public void questionForms() {
    JSONObject recordTypesJson = parseEndpoint(baseurl + "/service/record-types", 1000, "record-types");
    JSONArray recordTypesArray = (JSONArray) recordTypesJson.get("record-types");

    for(int i = 0; i < recordTypesArray.length(); i++) {
      String recordType = recordTypesArray.getString(i);

      JSONObject searches = parseEndpoint(baseurl + "/service/record-types/" + recordType + "/searches", 1000, "searches");
      JSONArray searchesArray = (JSONArray) searches.get("searches");

      for(int j = 0; j < searchesArray.length(); j++) {
        JSONObject search = (JSONObject) searchesArray.get(j);
        String urlSegment = (String) search.get("urlSegment");
        String fullName = (String) search.get("fullName");
        JSONArray paramNames = (JSONArray) search.get("paramNames");

        if(urlSegment.equals("GenesByUserDatasetAntisense") || 
            urlSegment.equals("GenesByRNASeqUserDataset") || 
            urlSegment.equals("GenesByeQTL") ||
            urlSegment.equals("GenesFromTranscripts") ||
            urlSegment.equals("GenesByPlasmoDbDataset") ||
            urlSegment.equals("boolean_question_TranscriptRecordClasses_TranscriptRecordClass")
            )
          continue;

        boolean hasParameters = paramNames.length() > 0;
        String queryPage = this.baseurl + "/app/search/" + recordType + "/" + urlSegment;
        driver.get(queryPage);

        SearchForm searchForm = new SearchForm(driver, hasParameters);
        searchForm.waitForPageToLoad();

        assertTrue(!searchForm.containsError(), "Search form Contained Error: " + urlSegment);
      }
    }
  }
  
  

  public static JSONObject parseEndpoint (String url, int timeout, String rootName)  {
      HttpURLConnection c = null;

      try {
          URL u = new URL(url);
          c = (HttpURLConnection) u.openConnection();
          c.setRequestMethod("GET");
          c.setRequestProperty("Content-length", "0");
          c.setUseCaches(false);
          c.setAllowUserInteraction(false);
          c.setConnectTimeout(timeout);
          c.setReadTimeout(timeout);
          c.connect();
          int status = c.getResponseCode();

          switch (status) {
              case 200:

                BufferedReader br = new BufferedReader(new InputStreamReader(c.getInputStream()));
                  StringBuilder sb = new StringBuilder();
                  String line;
                  while ((line = br.readLine()) != null) {
                      sb.append(line+"\n");
                  }
                  br.close();
                  return new JSONObject("{ \"" + rootName + "\":" + sb.toString() + "}");

          }
      } catch (Exception e) {
        e.printStackTrace();
      } finally {
         if (c != null) {
            try {
                c.disconnect();
            } catch (Exception ex) {

            }
         }
      }
      return null;
  }
  
}
