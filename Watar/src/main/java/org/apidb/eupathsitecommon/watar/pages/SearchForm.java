package org.apidb.eupathsitecommon.watar.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class SearchForm extends AjaxPage {
 
  private By standardQuestionFormParams = By.cssSelector(".wdk-QuestionFormParameterList");
  private By foldChangeParams = By.cssSelector(".wdk-FoldChangeParams");
  private By wizardParams = By.cssSelector(".ebrc-QuestionWizardParamContainer");
  
  //private By standardSubmit = By.cssSelector(".wdk-QuestionFormSubmitSection");
  //private By wizardSubmit = By.cssSelector(".ebrc-QuestionWizardSubmitContainer");

  //private By questionHeader = By.cssSelector(".wdk-QuestionFormQuestionHeader");
  
  private boolean hasParameters;
  
  public SearchForm(WebDriver driver, boolean hasParameters){
    super(driver);
    this.hasParameters = hasParameters;
  }

  
  public boolean containsError() {
    if(this.driver.getPageSource().contains("Unknown parameter")) {
      return true;
    }
    return false;
  }
  
  @Override
  public void waitForPageToLoad() {
    if(hasParameters) {
      new WebDriverWait(driver, 30, 3)
      .until(ExpectedConditions.or(
          ExpectedConditions.presenceOfElementLocated(standardQuestionFormParams),
          ExpectedConditions.presenceOfElementLocated(foldChangeParams),
          ExpectedConditions.presenceOfElementLocated(wizardParams)
          ));
    }   

    /**
    new WebDriverWait(driver, 10, 3)
    .until(ExpectedConditions.or(
        ExpectedConditions.presenceOfElementLocated(standardSubmit),
        ExpectedConditions.presenceOfElementLocated(wizardSubmit)
        ));
        **/
  }
  
  /**
  public int questionHeaderCount() {
    return driver.findElements(questionHeader).size();
  }
 **/

}
