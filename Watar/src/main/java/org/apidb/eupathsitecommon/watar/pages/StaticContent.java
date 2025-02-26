package org.apidb.eupathsitecommon.watar.pages;

import java.time.Duration;

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
    new WebDriverWait(driver, Duration.ofSeconds(30), Duration.ofMillis(3))
    .until(ExpectedConditions.presenceOfElementLocated(staticContent));
  }
  
}
