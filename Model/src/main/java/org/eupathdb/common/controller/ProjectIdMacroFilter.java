package org.eupathdb.common.controller;

import java.io.IOException;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.gusdb.wdk.model.Utilities;
import org.gusdb.wdk.model.WdkModel;

/**
 * Replaces occurrence of "/-PROJECT-/" in a URL with the project id of the WDK application.
 */
public class ProjectIdMacroFilter implements Filter {

  private ServletContext _context = null;
  private static final String projectIdMacro = "(.*)/-PROJECT-/(.*)";

  @Override
  public void init(FilterConfig config) throws ServletException {
    this._context = config.getServletContext();
  }

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    if (request instanceof HttpServletRequest && response instanceof HttpServletResponse
        && hasMacro((HttpServletRequest) request)) {
      handleMacro((HttpServletRequest) request, (HttpServletResponse) response);
    } else {
      chain.doFilter(request, response);
    }
  }

  private boolean hasMacro(HttpServletRequest request) {
    return getPath(request).matches(projectIdMacro);
  }

  private void handleMacro(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
    WdkModel wdkModel = (WdkModel) _context.getAttribute(Utilities.WDK_MODEL_KEY);
    String projectId = wdkModel.getProjectId();
    String newUrl = getPath(request).replaceAll(projectIdMacro, "$1/" + projectId + "/$2");
    RequestDispatcher dispatcher = request.getRequestDispatcher(newUrl);
    dispatcher.forward(request, response);
  }

  private String getPath(HttpServletRequest request) {
    return request.getServletPath();
  }

  @Override
  public void destroy() {
    this._context = null;
  }

}
