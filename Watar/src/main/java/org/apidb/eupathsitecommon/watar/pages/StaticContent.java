package org.apidb.eupathsitecommon.watar.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;

import org.openqa.selenium.support.ui.WebDriverWait;

public class StaticContent extends AjaxPage{
  
  private By staticContent = By.cssSelector(".static-content");

  public StaticContent(WebDriver driver){
    super(driver);
  }

  @Override
  public void waitForPageToLoad() {
    new WebDriverWait(driver, 30, 3)
    .until(ExpectedConditions.presenceOfElementLocated(staticContent));
  }
  
}
