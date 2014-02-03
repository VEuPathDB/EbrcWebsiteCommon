package org.apidb.eupathsitecommon.watar;

import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import com.gargoylesoftware.htmlunit.html.HtmlElement;
import com.gargoylesoftware.htmlunit.html.HtmlTextInput;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A simple Google search test using HtmlUnit.
 *
 * http://www.qaautomation.net/?p=90
 *
 * @author Rahul Poonekar
 * @since Apr 18, 2010
 */
public class SampleHtmlUnitTest {
    static final WebClient browser;

    static {
        browser = new WebClient();
        browser.getOptions().setJavaScriptEnabled(false);
    }

    public static void main(String[] arguments) {
        boolean result;
        try {
            result = searchTest();
        } catch (Exception e) {
            e.printStackTrace();
            result = false;
        }

        System.out.println("Test " + (result? "passed." : "failed."));
        if (!result) {
            System.exit(1);
        }
    }

    private static boolean searchTest() {
        HtmlPage currentPage;

        try {
            currentPage = (HtmlPage) browser.getPage("http://www.google.com");
        } catch (Exception e) {
            System.out.println("Could not open browser window");
            e.printStackTrace();
            return false;
        }
        System.out.println("Simulated browser opened.");

        try {
            ((HtmlTextInput) currentPage.getElementByName("q")).setValueAttribute("qa automation");
            currentPage = ((HtmlElement)currentPage.getElementByName("btnG")).click();
            //System.out.println("contents: " + currentPage.asText());
            return containsPattern(currentPage.asText(), "About .* results");
        } catch (Exception e) {
            System.out.println("Could not search");
            e.printStackTrace();
            return false;
        }
    }

    public static boolean containsPattern(String string, String regex) {
        Pattern pattern = Pattern.compile(regex);

        // Check for the existence of the pattern
        Matcher matcher = pattern.matcher(string);
        return matcher.find();
    }
}
