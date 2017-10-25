package org.eupathdb.common.taglib.wdk;

import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspContext;
import javax.servlet.jsp.JspException;
import javax.servlet.jsp.PageContext;

import org.apache.log4j.Logger;
import org.apache.struts.Globals;
import org.apache.struts.action.ActionMessage;
import org.apache.struts.action.ActionMessages;
import org.apache.struts.taglib.TagUtils;
import org.gusdb.fgputil.FormatUtil;
import org.gusdb.fgputil.FormatUtil.Style;
import org.gusdb.fgputil.events.Events;
import org.gusdb.fgputil.web.HttpRequestData;
import org.gusdb.wdk.controller.CConstants;
import org.gusdb.wdk.errors.ErrorBundle;
import org.gusdb.wdk.errors.ErrorContext;
import org.gusdb.wdk.errors.ErrorContext.RequestType;
import org.gusdb.wdk.errors.ValueMaps;
import org.gusdb.wdk.errors.ValueMaps.RequestAttributeValueMap;
import org.gusdb.wdk.errors.ValueMaps.ServletContextValueMap;
import org.gusdb.wdk.errors.ValueMaps.SessionAttributeValueMap;
import org.gusdb.wdk.events.ErrorEvent;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkUserException;

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

    private static final Logger LOG = Logger.getLogger(ErrorsTag.class);

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

            // contains possible errors sent to this tag
            ErrorBundle errors = getErrorBundle(pageContext, request);

            // write nothing if no errors present
            if (!errors.hasErrors()) return;

            // contains current server and request context
            ErrorContext context = getErrorContext(servletContext, request, getWdkModel());

            // write error to log
            logException(errors, context);

            // trigger error event so listeners can handle this error
            Events.trigger(new ErrorEvent(errors, context));

            // if caller added showStacktrace attribute, use it; otherwise show only if site is not monitored
            boolean showStacktrace = (_showStacktrace != null ? _showStacktrace : !context.isSiteMonitored());

            // write error summary in HTML to output provided
            writeErrorSummaryToPage(jspContext, errors, context.getLogMarker(), showStacktrace);
        }
        catch (Exception e) {
            throw new JspException("Unable to complete errors tag logic.", e);
        }
    }

    private static void logException(ErrorBundle errors, ErrorContext context) {
      String exceptionText = errors.getStackTraceAsText();
      if (exceptionText != null)
          LOG.error(exceptionText);
      LOG.error("log4j marker: " + context.getLogMarker());
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
            (Exception)request.getAttribute(Globals.EXCEPTION_KEY),    // exceptions caught by Struts (e.g. thrown by Actions)
            pageContext.getException(),                                // exceptions during page processing (e.g. JSTL syntax errors)
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
            new HttpRequestData(request),
            ValueMaps.toMap(new ServletContextValueMap(servletContext)),
            ValueMaps.toMap(new RequestAttributeValueMap(request)),
            ValueMaps.toMap(new SessionAttributeValueMap(request.getSession())),
            RequestType.WDK_SITE);
    }

    /**
     * Writes an appropriate error message to the JSP page for user to view.
     * 
     * @param jspContext context from which writer will be retrieved
     * @param errors error bundle for this error
     * @param logMarker log marker which may be displayed
     * @param showStacktrace whether to show stack trace for any exception
     */
    private static void writeErrorSummaryToPage(JspContext jspContext,
            ErrorBundle errors, String logMarker, boolean showStacktrace) {

        PrintWriter out = new PrintWriter(jspContext.getOut());

        String actionErrors = errors.getActionErrorsAsHtml();
        Exception wdkException = errors.getException();
        if (!actionErrors.isEmpty()) {
            out.println("<br/>\n<em><b>Please correct the following error(s): </b></em><br/>\n" + actionErrors);
        }
        else if (wdkException != null && wdkException instanceof WdkUserException) {
            out.println("<br>\n" +
                "<pre style=\"margin:0\">" +
                FormatUtil.prettyPrint(((WdkUserException)wdkException).getParamErrors(), Style.MULTI_LINE) +
                "</pre>\n\n");
        }

        if (showStacktrace && !(wdkException instanceof WdkUserException)) {
            String st = errors.getStackTraceAsText();
            if (st != null) {
                out.println("<br>\n<pre>\n\n" + st + "\n</pre>\n");
            }
            out.println("log4j marker: " + logMarker);
        }
    }
}
