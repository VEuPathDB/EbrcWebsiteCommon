package org.apidb.eupathsitecommon.watar.pages;

import org.openqa.selenium.WebDriver;

public abstract class AjaxPage extends Page {

  public AjaxPage(WebDriver driver) {
    super(driver);
  }

  public abstract void waitForPageToLoad();
  
}
