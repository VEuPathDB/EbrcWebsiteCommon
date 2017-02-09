package org.eupathdb.common.taglib.wdk;

import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Properties;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspContext;
import javax.servlet.jsp.JspException;
import javax.servlet.jsp.PageContext;

import org.apache.struts.Globals;
import org.apache.struts.action.ActionMessage;
import org.apache.struts.action.ActionMessages;
import org.apache.struts.taglib.TagUtils;
import org.eupathdb.common.errors.ErrorBundle;
import org.eupathdb.common.errors.ErrorContext;
import org.eupathdb.common.errors.ErrorHandler;
import org.eupathdb.common.errors.ValueMaps;
import org.eupathdb.common.errors.ErrorHandler.WriterProvider;
import org.eupathdb.common.errors.ValueMaps.RequestAttributeValueMap;
import org.eupathdb.common.errors.ValueMaps.ServletContextValueMap;
import org.eupathdb.common.errors.ValueMaps.SessionAttributeValueMap;
import org.gusdb.wdk.controller.CConstants;
import org.gusdb.wdk.controller.actionutil.HttpRequestData;
import org.gusdb.wdk.model.WdkModel;

/**
 * Error handling tag modeled after (and meant to replace) WDK's errors.tag.
 * Provides error/exception messaging display in JSP with conditional display of 
 * stack traces on non-public sites. A public site does not display stack traces
 * and is defined as site with hostname beginning with a value in the
 * PUBLIC_PREFIXES String array. ActionMessages are always displayed unless
 * there's also a pageContext exception or application exceptions.
 *
 * Like the WDK's errors.tag, this tag handles:
 * - ActionMessages, e.g. form validation errors ( ${requestScope['org.apache.struts.action.ERROR']} )
 * - Application exceptions ( ${requestScope['org.apache.struts.action.EXCEPTION']} )
 * - JSP/JSTL syntax errors ( ${pageContext.exception} )
 *
 * Unlike the errors.tag, this tag does not display ActionMessages when there
 * is an application or JSP exception as the resulting ActionMessage text is garbage.
 *
 * Also includes conditional error reporting via email. Email addresses are set
 * in the ADMIN_EMAIL property of the WDK's model-config.xml (CWL 13APR16). Only public sites 
 * compose and send email reports.
 * 
 * @author mheiges
 * @author rdoherty
 * 
 * Last edit $Id: ErrorsTag.java 73997 2016-04-15 12:16:29Z crisl $
 */
public class ErrorsTag extends WdkTagBase {

    // file defining error filters
    private static final String FILTER_FILE = "/WEB-INF/wdk-model/config/errorsTag.filter";
    
    // holds showStackTrace tag attribute which may or may not have been passed
    private Boolean _showStacktrace;
    
    public ErrorsTag() {
        super(PageContext.PAGE_SCOPE);
    }
    
    @Override
    public void doTag() throws JspException { 
        super.doTag();
        try {
            // get objects error handler needs
            ServletContext servletContext = getContext();
            JspContext jspContext = getJspContext();
            PageContext pageContext = (PageContext)jspContext;
            HttpServletRequest request = (HttpServletRequest)getRequest();
            
            // create and configure handler for this error
            ErrorHandler handler = new ErrorHandler(
                // contains possible errors sent to this tag
                getErrorBundle(pageContext, request),
                // contains filters to sort errors
                getFilters(pageContext),
                // contains current server and request context
                getErrorContext(servletContext, request, getWdkModel()),
                // allows access to JSP writer
                new JspWriterProvider(jspContext));
            
            // if caller added showStacktrace attribute, set it on handler
            if (_showStacktrace != null) handler.setShowStacktrace(_showStacktrace);
            
            // log, mail, and display error as appropriate
            handler.handleErrors();
        }
        catch (Exception e) {
            throw new JspException("Unable to complete errors tag logic.", e);
        }
    }

    /**
     * Sets optional showStackTrace attribute on this tag.  If set to true,
     * prints stack trace to page.  Default behavior is to print stack trace if
     * not a public-facing site, but hide trace if site is public-facing.
     * 
     * @param showStacktrace whether to print stack trace to the page
     */
    public void setShowStacktrace(String showStacktrace) {
        _showStacktrace = Boolean.parseBoolean(showStacktrace);
    }
    
    /**
     * Gather the exceptions and error messages that may have been sent to this
     * tag and encapsulate in ErrorBundle.
     * 
     * @param pageContext pageContext for this tag
     * @param request request initiating this tag
     * @return combined errors present in request/page
     * @throws JspException if error occurs fetching action messages
     */
    private static ErrorBundle getErrorBundle(PageContext pageContext, HttpServletRequest request) throws JspException {
        return new ErrorBundle(
            pageContext.getException(),                                // exceptions during page processing (e.g. JSTL syntax errors)
            (Exception)request.getAttribute(Globals.EXCEPTION_KEY),    // exceptions caught by Struts (e.g. thrown by Actions)
            (Exception)request.getAttribute(CConstants.WDK_EXCEPTION), // exceptions explicitly passed (e.g. from question form or to showErrorPage.do)
            getActionErrors(pageContext));                             // error messages (e.g. added during form processing)
    }

    /**
      * Builds list equivalent of:
      *   <html:messages id="error" message="false">
      *     <bean:write name="error"/>
      *   </html:messages>
      *
      * Based on MessagesTag.java from Struts 1.2.4 
      * http://grepcode.com/file/repo1.maven.org/maven2/struts/struts/1.2.4/org/apache/struts/taglib/html/MessagesTag.java/?v=source
      **/
    private static List<String> getActionErrors(PageContext pageContext) throws JspException {
        List<String> actionErrors = new ArrayList<>();
        ActionMessages messages = TagUtils.getInstance().getActionMessages(pageContext, Globals.ERROR_KEY);
        Iterator<?> i = messages.get();
        while (i.hasNext()) {
            ActionMessage report = (ActionMessage) i.next();
            actionErrors.add(TagUtils.getInstance().message(
                pageContext, null, Globals.LOCALE_KEY,
                report.getKey(), report.getValues()));
        }
        return actionErrors;
    }

    /**
     * Loads filters from config file into Properties object
     * 
     * @param context context to use to fetch resource
     * @return properties object containing filters
     * @throws IOException if unable to load filters
     */
    private static Properties getFilters(PageContext context) throws IOException {
        Properties filters = new Properties();
        InputStream is = context.getServletContext().getResourceAsStream(FILTER_FILE);
        if (is != null) {
            filters.load(is);
        }
        return filters;
    }
    
    /**
     * Aggregate environment context data into an object for easy referencing
     * 
     * @param servletContext current servlet context
     * @param request current HTTP servlet request
     * @param wdkModel this WDK Model
     * @return context data for this error
     */
    private static ErrorContext getErrorContext(ServletContext servletContext,
            HttpServletRequest request, WdkModel wdkModel) {
        return new ErrorContext(
            wdkModel,
            servletContext.getInitParameter("model"),
            new HttpRequestData(request),
            ValueMaps.toMap(new ServletContextValueMap(servletContext)),
            ValueMaps.toMap(new RequestAttributeValueMap(request)),
            ValueMaps.toMap(new SessionAttributeValueMap(request.getSession())));
    }
    
    /**
     * Implementation of WriterProvider that provides access to a JspWriter via
     * a JspContext.  Writer is not initialized until getPrintWriter() is called
     * the first time; all subsequent calls return the same PrintWriter.
     * 
     * @author rdoherty
     */
    public static class JspWriterProvider implements WriterProvider {
        private JspContext _context;
        private PrintWriter _writer;
        public JspWriterProvider(JspContext context) {
            _context = context;
        }
        @Override
        public PrintWriter getPrintWriter() {
            if (_writer == null)
                _writer = new PrintWriter(_context.getOut());
            return _writer;
        }
    }
}
