package org.apidb.eupathsitecommon.watar;

//import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
//import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.chrome.ChromeDriver;
//import org.openqa.selenium.htmlunit.HtmlUnitDriver;     
import org.openqa.selenium.Dimension;

import org.testng.annotations.Test;

import org.testng.annotations.BeforeTest;
import org.testng.annotations.DataProvider;
import org.testng.annotations.AfterTest;
import org.json.JSONArray;
import org.json.JSONObject;

//import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

import java.util.ArrayList;
import java.util.Iterator;

import org.apidb.eupathsitecommon.watar.pages.HomePage;
import org.apidb.eupathsitecommon.watar.pages.LoginPage;
import org.apidb.eupathsitecommon.watar.pages.SearchForm;
import org.apidb.eupathsitecommon.watar.pages.Service;
import org.apidb.eupathsitecommon.watar.pages.StaticContent;

public class SeleniumTests {
  private WebDriver driver;
  //private JavascriptExecutor js;

  private String baseurl;
  private String username;
  private String password;
  
//  private boolean isPortal;

  public SeleniumTests() {

    baseurl = System.getProperty("baseurl") + "/" + System.getProperty("webappname");
    username = System.getProperty("username");
    password = System.getProperty("password");

    //isPortal = baseurl.toLowerCase().contains("eupathdb");

  }

  @BeforeTest
  public void setUp() {
   this.driver = new ChromeDriver();
   driver.manage().window().setSize(new Dimension(1000, 1000));
   
   LoginPage loginPage = new LoginPage(driver, username, password);
   loginPage.login();

   
   //js = (JavascriptExecutor) driver;
  }
  @AfterTest
  public void tearDown() {
   driver.quit();
  }

  
  @DataProvider(name = "staticPages")
  public Iterator<Object[]> createStaticPages() {
    ArrayList<Object[]> staticPages = new ArrayList<Object[]>();

    Object[] ds = { Utilities.DATA_SUBMISSION, "Data Submission" }; 
    Object[] news = { Utilities.NEWS_PATH, "News" }; 
    Object[] pubs = { Utilities.PUBLICATIONS, "Publications" }; 
    Object[] rel_sites = { Utilities.RELATED_SITES, "Related Sites" }; 
    Object[] about = { Utilities.ABOUT, "About"}; 
    Object[] privacy = { Utilities.PRIVACY_POLICY, "Privacy Policy"}; 
    Object[] personnel = { Utilities.PERSONNEL, "Personnel"}; 
    Object[] acks = { Utilities.ACKS, "Acknowledgements"}; 
    Object[] methods = { Utilities.METHODS, "Methods"}; 
    Object[] infra = { Utilities.INFRASTRUCTURE, "Infrastructure"}; 

    staticPages.add(ds);
    staticPages.add(news);
    staticPages.add(pubs);
    staticPages.add(rel_sites);
    staticPages.add(about);
    staticPages.add(privacy);
    staticPages.add(personnel);
    staticPages.add(acks);
    staticPages.add(methods);
    staticPages.add(infra);
    
    return staticPages.iterator();
  }
  
  @DataProvider(name = "searches")
  public Iterator<Object[]> createSearches() {
   
    ArrayList<Object[]> searchesArrayList = new ArrayList<Object[]>();
    
    JSONObject recordTypesJson = parseEndpoint(baseurl + "/service/record-types", "record-types");
    JSONArray recordTypesArray = (JSONArray) recordTypesJson.get("record-types");

    for(int i = 0; i < recordTypesArray.length(); i++) {
      String recordType = recordTypesArray.getString(i);

      JSONObject searches = parseEndpoint(baseurl + "/service/record-types/" + recordType + "/searches", "searches");
      JSONArray searchesArray = (JSONArray) searches.get("searches");

      for(int j = 0; j < searchesArray.length(); j++) {
        JSONObject search = (JSONObject) searchesArray.get(j);
        String urlSegment = (String) search.get("urlSegment");
        String fullName = (String) search.get("fullName");
        JSONArray paramNames = (JSONArray) search.get("paramNames");

        if(urlSegment.equals("GenesByUserDatasetAntisense") || 
            urlSegment.equals("GenesByRNASeqUserDataset") || 
            urlSegment.equals("Gendescription=\"Assert home page loads and the featured tool section is there.\",esByeQTL") ||
            urlSegment.equals("GenesFromTranscripts") ||
            urlSegment.equals("GenesByPlasmoDbDataset") ||
            urlSegment.contains("boolean_question")
            )
          continue;

        boolean hasParameters = paramNames.length() > 0;
        String queryPage = this.baseurl + "/app/search/" + recordType + "/" + urlSegment;

        Object[] sa = new Object[3];
        sa[0] = queryPage;
        sa[1] = fullName;
        sa[2] = hasParameters;

        searchesArrayList.add(sa);
      }

    }
    return searchesArrayList.iterator();
  }
  
  @Test(dataProvider = "searches",
      description="Assert search page loads without error",
      groups = {"functional_tests"})
  public void searchPage(String queryPage, String fullName, boolean hasParameters) {
    driver.get(queryPage);

    SearchForm searchForm = new SearchForm(driver, hasParameters);
    searchForm.waitForPageToLoad();

    assertTrue(!searchForm.containsError(), "Search form Contained Error: " + fullName);
  }
  @Test(description="Assert home page loads and the featured tool section is present.",
      groups = { "functional_tests" })
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

  /**
   * Assert static content page loads without error and static-content element is present
   *
   * @param url url of the page
   * @param name name of the page
   */
  @Test(dataProvider="staticPages", 
      description="Assert static content page loads without error and static-content element is present",
      groups = { "static_content" })
  public void staticPage (String url, String name) {
    String staticPageUrl = this.baseurl + url;
    driver.get(staticPageUrl);
    StaticContent staticContentPage = new StaticContent(driver);
    staticContentPage.waitForPageToLoad();
  }


  public JSONObject parseEndpoint (String url, String rootName)  {
    this.driver.get(url);
    Service servicePage = new Service(driver);
    String jsonContent = servicePage.jsonContent();
    return new JSONObject("{ \"" + rootName + "\":" + jsonContent + "}");
  }
  
}
