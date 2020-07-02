package org.apidb.eupathsitecommon.watar.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;

import org.openqa.selenium.support.ui.WebDriverWait;

public class HomePage extends AjaxPage{
  
  private By checkBoxTreeItem = By.cssSelector(".wdk-CheckboxTreeList:nth-child(3) > .wdk-CheckboxTreeItem:nth-child(1) > .wdk-CheckboxTreeNodeWrapper span");

  private By selectedToolBody = By.cssSelector(".vpdb-FeaturedToolsSelectionBody");

  private By selectedTool = By.cssSelector(".vpdb-FeaturedToolsSelectionHeader");

  private By anotherTool = By.cssSelector(".fa-code-fork");
    
  public HomePage(WebDriver driver){
    super(driver);
  }

  public void changeSelectedTool() {
    changeSelectedTool(anotherTool);
  }

  public void changeSelectedTool(By tool) {
    driver.findElement(tool).click();
  }
  
  public int selectedToolBodyCount() {
    return driver.findElements(selectedToolBody).size();
  }

  
  @Override
  public void waitForPageToLoad() {
    new WebDriverWait(driver, 30, 3)
    .until(ExpectedConditions.presenceOfElementLocated(checkBoxTreeItem));
  }
  
  public String selectedToolHeaderText() {
    return driver.findElement(selectedTool).getText();
  }
  
}
