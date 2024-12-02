package org.eupathdb.common.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.runtime.GusHome;

/**
 * Servlet filter that returns either modern or legacy assets based on user
 * agent string
 */
public class AssetBundleFilter implements Filter {

  private static final Logger LOG = Logger.getLogger(AssetBundleFilter.class);
  private static final String BASE_PATH = "/bundles/";
  private static final String DEFAULT_SUB_PATH = "modern/";
  private static final String virtualBundlePattern = BASE_PATH + "(?!(modern|legacy)/)(.*)";

  @Override
  public void destroy() {
    // TODO Auto-generated method stub

  }

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
      String userAgentString = req.getHeader("user-agent");
      String subPath = getSubPath(userAgentString);
      String resourcePath = path.substring(BASE_PATH.length());
      String realPath = BASE_PATH + subPath + resourcePath;
      RequestDispatcher dispatcher = req.getRequestDispatcher(realPath);
      res.addHeader("x-real-path", realPath);
      dispatcher.forward(req, res);
      return;
    }
    chain.doFilter(servletRequest, servletResponse);
  }

  @Override
  public void init(FilterConfig config) throws ServletException {
    // TODO Auto-generated method stub

  }

  private static String getSubPath(String userAgentString) throws IOException {
    if (userAgentString == null) return DEFAULT_SUB_PATH;
    String gusHome = GusHome.getGusHome();
    LOG.info("gusHome: " + gusHome);
    LOG.info("userAgentString: " + userAgentString);
    String[] command = new String[] {
      gusHome + "/bin/getBundlesSubPath",
      userAgentString
    };
    ProcessBuilder ps = new ProcessBuilder(command);
    ps.redirectErrorStream(true);
    Process pr = ps.start();
    StringBuilder output = new StringBuilder();
    try (BufferedReader in = new BufferedReader(new InputStreamReader(pr.getInputStream()))) {
      String line;
      while ((line = in.readLine()) != null) {
        output.append(line);
      }
      pr.waitFor();
    }
    catch (Exception ex) {
      LOG.error("Unable to execute script getBundlesSubPath. Using default sub path.", ex);
      return DEFAULT_SUB_PATH;
    }
    if (pr.exitValue() != 0) {
      LOG.error("Script getBundlesSubPath did not return normally. Using sub path.\n" + output);
      return DEFAULT_SUB_PATH;
    }
    return output.toString();
  }
  
}
