package org.apidb.eupathsitecommon.watar.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class Service extends Page {

  private By content = By.xpath("//pre");
  
  public Service(WebDriver driver) {
    super(driver);
  }
  
  public String jsonContent() {
    return driver.findElement(content).getText();
  }

}
