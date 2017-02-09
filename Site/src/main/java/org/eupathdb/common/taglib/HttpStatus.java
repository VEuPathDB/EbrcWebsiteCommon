package org.eupathdb.common.taglib;

/**
Fetch the HTTP header and set var attribute to the status code.
Throws exceptions for connection and read timeouts - these timeouts 
can be defined with attributes.
**/

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.PageContext;
import javax.servlet.jsp.tagext.SimpleTagSupport;

public class HttpStatus extends SimpleTagSupport {

    protected String url;
    protected String var;
    protected int readTimeout = 0;
    protected int connectTimeout = 0;
    protected boolean followRedirect = true;
    protected int varScope;

    public HttpStatus() {
        varScope = PageContext.PAGE_SCOPE;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
    
    public void setVar(String var) {
        this.var = var;
    }

    public void setFollowRedirect(boolean followRedirect) {
        this.followRedirect = followRedirect;
    }
    
    public void setReadTimeout(int readTimeout) {
        this.readTimeout = readTimeout;
    }
    
    public void setConnectTimeout(int connectTimeout) {
        this.connectTimeout = connectTimeout;
    }

    @Override
    public void doTag() throws JspException { 

        try {
            URLConnection connection = new URL(url).openConnection();

            connection.setConnectTimeout(connectTimeout);
            connection.setReadTimeout(readTimeout);

            connection.connect();

            if ( connection instanceof HttpURLConnection) {
                HttpURLConnection httpConnection = (HttpURLConnection) connection;
                httpConnection.setInstanceFollowRedirects(followRedirect);
                int code = httpConnection.getResponseCode();
                if (var != null) getJspContext().setAttribute(var, code, varScope); 
            } else {
                throw new JspException(url + " is not a valid HTTP request");
            }

        } catch (MalformedURLException mure) {
            throw new JspException("(MalformedURLException) " + mure);
        } catch (IOException ioe) {
            throw new JspException("(IOException) " + ioe);
        }
    }
}