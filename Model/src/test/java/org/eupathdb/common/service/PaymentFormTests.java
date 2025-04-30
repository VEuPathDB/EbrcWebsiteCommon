package org.eupathdb.common.service;

import org.gusdb.fgputil.Tuples.ThreeTuple;
import org.junit.Assert;
import org.junit.Test;

public class PaymentFormTests {

  private static class TestConf extends ThreeTuple<String,Boolean,String> {
    public TestConf(String inputValue, boolean shouldParse, String outputValue) {
      super(inputValue, shouldParse, outputValue);
    }
    @Override
    public String toString() {
      return getFirst() + " " + getSecond() + " " + getThird();
    }
  }

  @Test
  public void testAmountValidation() {
    TestConf[] TESTS = new TestConf[] {
      new TestConf(null, false, null),
      new TestConf("", false, null),
      new TestConf("abc", false, null),
      new TestConf("abc.12", false, null),
      new TestConf("5", true, "5.00"),
      new TestConf("5.", false, null),
      new TestConf("123.45", true, "123.45"),
      new TestConf("123.456", false, null)
    };
    boolean testFailed = false;
    for (TestConf test : TESTS) {
      System.out.println("Amount test: " + test);
      try {
        String output = CyberSourceFormService.validateAmountParam(test.getFirst());
        System.out.println("Got output: " + output);
        if (!test.getSecond()) {
          System.err.println("Unexpected parse success in test: " + test);
          testFailed = true;
        }
        if (!output.equals(test.getThird())) {
          System.err.println("Unexpected output '" + output + "' in test: " + test);
          testFailed = true;
        }
      }
      catch (Exception e) {
        if (test.getSecond()) {
          System.err.println("Unexpected exception " + e.getClass().getSimpleName() + " in test: " + test);
          testFailed = true;
        }
      }
    }
    Assert.assertFalse(testFailed);
  }
}
