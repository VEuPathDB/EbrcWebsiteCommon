package org.eupathdb.common.service;

import java.util.function.Function;

import org.gusdb.fgputil.Tuples.ThreeTuple;
import org.junit.Assert;
import org.junit.Test;

public class PaymentFormTests {

  private static class TestCase extends ThreeTuple<String,Boolean,String> {

    public TestCase(String inputValue, boolean shouldParse, String outputValue) {
      super(inputValue, shouldParse, outputValue);
    }

    @Override
    public String toString() {
      return getFirst() + " " + getSecond() + " " + getThird();
    }
  }

  @Test
  public void testAmountValidation() {
    runTests(new TestCase[] {
        new TestCase(null, false, null),
        new TestCase("", false, null),
        new TestCase("abc", false, null),
        new TestCase("abc.12", false, null),
        new TestCase("5", true, "5.00"),
        new TestCase("5.", false, null),
        new TestCase("123.45", true, "123.45"),
        new TestCase("123.456", false, null)
    }, "amount", CyberSourceFormService::validateAmountParam);
  }


  @Test
  public void testCurrencyValidation() {
    runTests(new TestCase[] {
        new TestCase(null, true, "USD"),
        new TestCase("usd", true, "USD"),
        new TestCase("USD", true, "USD"),
        new TestCase("euros", false, null)
    }, "currency", CyberSourceFormService::validateCurrencyParam);
  }

  @Test
  public void testInvoiceNumberValidation() {
    runTests(new TestCase[] {
        new TestCase(null, true, CyberSourceFormService.INVOICE_NOT_SPECIFIED),
        new TestCase("", true, CyberSourceFormService.INVOICE_NOT_SPECIFIED),
        new TestCase("   ", true, CyberSourceFormService.INVOICE_NOT_SPECIFIED),
        new TestCase("na1-82-3B", true, "na1-82-3B"),
        new TestCase("delete table my_table;", false, null)
    }, "invoiceNumber", CyberSourceFormService::validateInvoiceNumber);
  }

  private void runTests(TestCase[] tests, String testName, Function<String,String> validator) {
    boolean testFailed = false;
    for (TestCase test : tests) {
      System.out.println(testName + " test: " + test);
      try {
        String output = validator.apply((test.getFirst()));
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
