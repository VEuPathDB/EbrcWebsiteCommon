package org.eupathdb.common.controller;

import java.io.IOException;
import java.util.regex.Pattern;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Servlet filter that returns either modern or legacy assets based on user
 * agent string
 */
public class AssetBundleFilter implements Filter {

  private static final String BASE_PATH = "/bundles/";
  private static final String DEFAULT_SUB_PATH = "modern/";
  private static final String LEGACY_SUBPATH = "legacy/";

  private static final String virtualBundlePattern = BASE_PATH + "(?!(modern|legacy)/)(.*)";

  private static final Pattern MODERN_USER_AGENT_PATTERN = Pattern.compile(
      "Edge?/(12[4-9]|1[3-9]\\d|[2-9]\\d{2}|\\d{4,})\\.\\d+(\\.\\d+|)" +
      "|Firefox/(10[2-9]|1[1-9]\\d|[2-9]\\d{2}|\\d{4,})\\.\\d+(\\.\\d+|)" +
      "|Chrom(ium|e)/(109|1[1-9]\\d|[2-9]\\d{2}|\\d{4,})\\.\\d+(\\.\\d+|)" +
      "|(Maci|X1{2}).+ Version/(17\\.([4-9]|\\d{2,})|(1[89]|[2-9]\\d|\\d{3,})\\.\\d+)([,.]\\d+|)( \\(\\w+\\)|)( Mobile/\\w+|) Safari/" +
      "|Chrome.+OPR/(109|1[1-9]\\d|[2-9]\\d{2}|\\d{4,})\\.\\d+\\.\\d+" +
      "|(CPU[ +]OS|iPhone[ +]OS|CPU[ +]iPhone|CPU IPhone OS|CPU iPad OS)[ +]+(15[._]([6-9]|\\d{2,})|(1[6-9]|[2-9]\\d|\\d{3,})[._]\\d+)([._]\\d+|)" +
      "|Opera Mini" +
      "|Android:?[ /-](12[7-9]|1[3-9]\\d|[2-9]\\d{2}|\\d{4,})(\\.\\d+|)(\\.\\d+|)" +
      "|Mobile Safari.+OPR/([89]\\d|\\d{3,})\\.\\d+\\.\\d+" +
      "|Android.+Firefox/(12[7-9]|1[3-9]\\d|[2-9]\\d{2}|\\d{4,})\\.\\d+(\\.\\d+|)" +
      "|Android.+Chrom(ium|e)/(12[7-9]|1[3-9]\\d|[2-9]\\d{2}|\\d{4,})\\.\\d+(\\.\\d+|)" +
      "|Android.+(UC? ?Browser|UCWEB|U3)[ /]?(15\\.([5-9]|\\d{2,})|(1[6-9]|[2-9]\\d|\\d{3,})\\.\\d+)\\.\\d+" +
      "|SamsungBrowser/(2[4-9]|[3-9]\\d|\\d{3,})\\.\\d+" +
      "|Android.+MQ{2}Browser/(14(\\.(9|\\d{2,})|)|(1[5-9]|[2-9]\\d|\\d{3,})(\\.\\d+|))(\\.\\d+|)" +
      "|K[Aa][Ii]OS/(2\\.([5-9]|\\d{2,})|([3-9]|\\d{2,})\\.\\d+)(\\.\\d+|)"
  );

  @Override
  public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
      throws IOException, ServletException {
    if (!(servletRequest instanceof HttpServletRequest) || !(servletResponse instanceof HttpServletResponse)) {
      chain.doFilter(servletRequest, servletResponse);
      return;
    }
    HttpServletRequest req = (HttpServletRequest) servletRequest;
    HttpServletResponse res = (HttpServletResponse) servletResponse;
    String path = req.getServletPath();
    if (path.matches(virtualBundlePattern)) {
      // run bundle logic if a bundle is requested (should always be true because of web.xml pattern matching)
      String userAgentString = req.getHeader("user-agent");
      String subPath = userAgentString == null ||
          MODERN_USER_AGENT_PATTERN.matcher(userAgentString).find()
          ? DEFAULT_SUB_PATH : LEGACY_SUBPATH;
      String resourcePath = path.substring(BASE_PATH.length());
      String realPath = BASE_PATH + subPath + resourcePath;

      RequestDispatcher dispatcher = req.getRequestDispatcher(realPath);
      res.addHeader("x-real-path", realPath);
      dispatcher.forward(req, res);
      return;
    }
    else {
      // otherwise handle
      chain.doFilter(servletRequest, servletResponse);
    }
  }

  @Override
  public void init(FilterConfig config) throws ServletException {
    // Nothing to do here
  }

  @Override
  public void destroy() {
    // Nothing to do here
  }

}
