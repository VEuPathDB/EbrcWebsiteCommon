package org.apidb.eupathsitecommon.watar;

//import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
//import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.Dimension;

import org.testng.annotations.Test;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.AfterTest;

//import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

import org.apidb.eupathsitecommon.watar.pages.HomePage;

public class SeleniumTests {
  private WebDriver driver;
  //private JavascriptExecutor js;

  private String baseurl;
  private String webappname;
//  private boolean isPortal;

  public SeleniumTests() {
//    baseurl = "https://feature.plasmodb.org";
//    webappname = "plasmo.feature";
    baseurl = System.getProperty("baseurl");
    webappname = System.getProperty("webappname");

    //    isPortal = baseurl.toLowerCase().contains("eupathdb");
  }
  
  @BeforeTest
  public void setUp() {
   this.driver = new ChromeDriver();
   driver.manage().window().setSize(new Dimension(1000, 528));
   //js = (JavascriptExecutor) driver;
  }
  @AfterTest
  public void tearDown() {
   driver.quit();
  }

  @Test(description="Assert home page loads and the featured tool section is there.",
      groups = { "_" })
  public void homePage () {
    String url = baseurl + "/" + webappname + "/";
    driver.get(url);
    HomePage homePage = new HomePage(driver);
    homePage.waitForPageToLoad();
    assertTrue(homePage.selectedToolBodyCount() == 1, "assert Selected Tool Body was present");
    String initialSelectedToolText = homePage.selectedToolHeaderText();
    homePage.changeSelectedTool();
    String changedSelectedToolText = homePage.selectedToolHeaderText();
    assertTrue(!initialSelectedToolText.equals(changedSelectedToolText), "assert Selected Tool was Changed");
  }
}
