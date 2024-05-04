package org.eupathdb.common.controller;

import java.io.File;
import java.io.IOException;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class MelodyDisplayFilter implements Filter {

	// these values were borrowed from Java Melody
	private static final String MONITORING_PATH_PARAM_NAME = "monitoring-path";
	private static final String DEFAULT_MONITORING_PATH = "/monitoring";
	
	private String _gusHome;
	private String _monitoringPath;

	@Override
	public void init(FilterConfig config) throws ServletException {

		_monitoringPath = (config.getInitParameter(MONITORING_PATH_PARAM_NAME) == null ?
				DEFAULT_MONITORING_PATH : config.getInitParameter(MONITORING_PATH_PARAM_NAME));
		
		_gusHome = config.getServletContext().getRealPath(
				config.getServletContext().getInitParameter("GUS_HOME"));
	}

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
			throws IOException, ServletException {
		if (isHttpRequest(request, response) &&  // if not HTTP request, then Melody will ignore
		    isMelodyDisplayUrl(request) &&       // if not monitoring URL, then let through
		    !isMelodyDisplayEnabled())           // if display enabled, then let through
		{
	      // need to deny access to this URL so Melody does not display interface
	      HttpServletResponse httpResponse = (HttpServletResponse)response;
		  httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Page Unavailable.");
		}
		// all other requests are passed through
		chain.doFilter(request, response);
		return;
	}

	private boolean isHttpRequest(ServletRequest request, ServletResponse response) {
		return (request instanceof HttpServletRequest) && (response instanceof HttpServletResponse);
	}

	private boolean isMelodyDisplayEnabled() {
		return new File(_gusHome + "/config/MELODY_ENABLED").exists();
	}

	private boolean isMelodyDisplayUrl(ServletRequest request) {
		// assume request cast has already been checked
		HttpServletRequest httpRequest = (HttpServletRequest)request;
		return httpRequest.getRequestURI().equals(httpRequest.getContextPath() + _monitoringPath);
	}

	@Override
	public void destroy() {
		// do nothing
	}
}
