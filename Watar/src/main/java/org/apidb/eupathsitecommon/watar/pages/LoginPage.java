package org.apidb.eupathsitecommon.watar.pages;

import org.apidb.eupathsitecommon.watar.Utilities;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class LoginPage extends Page {

  private By username = By.name("username");
  private By password = By.name("password");
  private By login = By.xpath("//input[@value=\'Login\']");
  
  private String u;
  private String p;
  
  public LoginPage(WebDriver driver, String u, String p) {
    super(driver);
    this.u = u;
    this.p = p;
  }

  public void login() {
    driver.get (Utilities.LOGIN_PAGE);
    driver.findElement(username).sendKeys(this.u);
    driver.findElement(password).sendKeys(this.p);
    driver.findElement(login).click();
  }
  
  
}
