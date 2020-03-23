package org.eupathdb.common.controller;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Redirects the user to either the beta site or the legacy site, depending on
 * the value of the `useBetaSite` cookie. This value is overridden by a query
 * param of the same name. If the cookie or query param are not present, then
 * the user does not get redirected.
 * 
 * RULES:
 * - On legacy site
 *   - If `useBetaSite = 0`, set cookie value, but don't redirect
 *   - If `useBetaSite = 1`, set cookie value, and redirect to beta site
 * - On beta site
 *   - If `useBetaSite = 0`, set cookie value, and redirect to the legacy site
 *   - If `useBetaSite = 1`, set cookie value, and don't redirect
 */
public class BetaLegacyFilter implements Filter {

  private static final String cookieName = "useBetaSite";
  private boolean _isBeta;

  @Override
  public void init(FilterConfig config) throws ServletException {
    this._isBeta = "true".equals(config.getInitParameter("beta"));
  }

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    if (!(request instanceof HttpServletRequest) || !(response instanceof HttpServletResponse)) {
      chain.doFilter(request, response);
      return;
    }
  
    HttpServletRequest httpReq = (HttpServletRequest) request;
    HttpServletResponse httpRes = (HttpServletResponse) response;
    String paramValue = httpReq.getParameter(cookieName);
    String cookieValue = getCookieValue(httpReq, cookieName);
    if (paramValue == null && cookieValue == null) chain.doFilter(request, response);
    else doRedirect(request, response, chain, httpReq, httpRes, paramValue, cookieValue);
  }

  private void doRedirect(ServletRequest request, ServletResponse response, FilterChain chain,
      HttpServletRequest httpReq, HttpServletResponse httpRes, String paramValue, String cookieValue)
      throws IOException, ServletException, MalformedURLException {
    String value = paramValue != null ? paramValue : cookieValue;
    boolean useBeta = value.equals("1");
    String rootDomain = getRootDomain(httpReq);
    if (paramValue != null) setCookie(httpRes, useBeta, rootDomain);
    if (_isBeta == useBeta) {
      if (paramValue == null) chain.doFilter(request, response);
      else httpRes.sendRedirect(httpReq.getRequestURL().toString());
    }
    else {
      URL url = new URL(httpReq.getScheme(), (useBeta ? "beta." : "") + rootDomain, httpReq.getServerPort(), "/");
      httpRes.sendRedirect(url.toString());
    }
  }

  private static void setCookie(HttpServletResponse httpRes, boolean useBeta, String rootDomain) {
    Cookie cookie = new Cookie(cookieName, useBeta ? "1" : "0");
    cookie.setDomain(rootDomain);
    cookie.setMaxAge(/* 1 year */ 365 * 24 * 60 * 60);
    cookie.setPath("/");
    httpRes.addCookie(cookie);
  }

  private static String getRootDomain(HttpServletRequest httpReq) {
    String[] serverNameParts = httpReq.getServerName().split("\\.");
    String rootDomain = serverNameParts[serverNameParts.length - 2] + "." + serverNameParts[serverNameParts.length - 1];
    return rootDomain;
  }

  private static String getCookieValue(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();

    if (name == null || cookies == null) return null;
    
    for (Cookie cookie : cookies) {
      if (name.equals(cookie.getName())) {
        return cookie.getValue();
      }
    }
    return null;
  }

  @Override
  public void destroy() {
    // TODO Auto-generated method stub

  }

}