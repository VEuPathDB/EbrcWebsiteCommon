package org.eupathdb.common.errors;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.FormatUtil;
import org.gusdb.wdk.controller.actionutil.RequestData;
import org.gusdb.wdk.model.WdkException;

public class ErrorHandler {

    private static Logger LOG = Logger.getLogger(ErrorHandler.class.getName());

    private static final String PAGE_DIV = "\n************************************************\n";

    public interface WriterProvider {
        public PrintWriter getPrintWriter();
    }
    
    public static class ValueTransform<T> {
        public String transformValue(String key, T value) { return value.toString(); }
    }

    private final ErrorBundle _errors;
    private final Properties _filters;
    private final ErrorContext _context;
    private final WriterProvider _writerProvider;
    private final String _logMarker;

    private boolean _showStacktrace;

    public ErrorHandler(ErrorBundle errors, Properties filters,
            ErrorContext context, WriterProvider writerProvider) {
        _errors = errors;
        _filters = filters;
        _context = context;
        _writerProvider = writerProvider;
        _logMarker = UUID.randomUUID().toString();
        _showStacktrace = !_context.isSiteMonitored();
    }

    public void handleErrors() {
        
        // do nothing and return if no errors
        if (!_errors.hasErrors()) return;

        // check to see if this error matches a filter
        String matchedFilterKey = filterMatch(_errors, _filters, _context.getRequestData());

        // take action on this error depending on context and filter match
        String filterMatchWarning = "";
        if (_context.isSiteMonitored()) {
            if (matchedFilterKey == null) {
                // error did not match filters
                constructAndSendMail(_errors, _context, _logMarker);
            }
            else {
                // error is being filtered out; write to filter log
                writeFilteredErrorsToLog(_errors, _context, _logMarker, matchedFilterKey);
                filterMatchWarning = "\nError matches filter '" + matchedFilterKey + "'. No error report emailed.";
            }
        }
        else {
            // site is not monitored; simply log the exception
            LOG.error(getStackTraceAsText(_errors));
        }

        // write log marker to log so we can see what was going on around this error
        LOG.error(_logMarker + filterMatchWarning);
        
        // write error summary in HTML to output provided
        writeErrorSummaryToPage(_writerProvider, _errors, _logMarker, _showStacktrace);
    }

    public void setShowStacktrace(boolean showStacktrace) {
        _showStacktrace = showStacktrace;
    }

    /**
     * Check for matches to filters. Filters are regular expressions in a
     * property file. The file is optional. In which case, no filtering is
     * performed.
     * 
     * Matches are checked against the text of errors and stacktraces.
     * 
     * Property file example 1. A simple check for missing step ids.
     * 
     * noStepForUser = The Step #\\d+ of user .+ doesn't exist
     * 
     * Compound filtering can be configured with specific subkeys in the
     * property file (the primary key is always required).
     * 
     * Property file example 2. Filter when exceptions contain the words
     * "twoPartName is null" and also the referer is empty.
     * 
     * twoPartNameIsNull = twoPartName is null twoPartNameIsNull.referer =
     * 
     * Allowed subkeys are referer ip
     **/
    private static String filterMatch(ErrorBundle errors, Properties filters, RequestData requestData) {

        StringBuilder allErrors = new StringBuilder();
        allErrors.append(getStackTraceAsText(errors));
        allErrors.append(getActionErrorsAsHtml(errors.getActionErrors()));
        LOG.debug("Will use the following text as filter input:\n" + allErrors.toString());

        Set<String> propertyNames = filters.stringPropertyNames();
        for (String key : propertyNames) {

            // don't check subkeys yet
            if (key.contains("."))
                continue;

            String regex = filters.getProperty(key);
            Pattern p = Pattern.compile(regex);
            Matcher m = p.matcher(allErrors);

            LOG.debug("Checking against filter: " + regex);
            if (m.find()) {
                LOG.debug("Match!");
                /**
                 * Found match for primary filter. Now check for additional
                 * matches from any subkey filters. Return on first match.
                 **/
                boolean checkedSubkeys = false;
                String refererFilter = filters.getProperty(key + ".referer");
                String ipFilter = filters.getProperty(key + ".ip");

                if (refererFilter != null) {
                    checkedSubkeys = true;
                    String referer = valueOrDefault(requestData.getReferrer(), "");
                    if (refererFilter.equals(referer))
                        return key + " = " + regex + " AND " + key
                                + ".referer = " + refererFilter;
                }

                if (ipFilter != null) {
                    checkedSubkeys = true;
                    String remoteHost = valueOrDefault(requestData.getRemoteHost(),
                            "");
                    if (ipFilter.equals(remoteHost))
                        return key + " = " + regex + " AND " + key + ".ip = "
                                + ipFilter;
                }

                // subkeys were checked and no matches in subkeys,
                // so match is not sufficient to filter
                if (checkedSubkeys) {
                    LOG.debug("Matched primary filter but not any subkeys; moving to next filter.");
                    continue;
                }

                // Otherwise no subkeys were checked (so primary
                // filter match is sufficient)
                return key + " = " + regex;
            }
        }
        
        // did not match any filter
        return null;
    }

    private static void constructAndSendMail(ErrorBundle errors, ErrorContext context, String logMarker) {

        RequestData requestData = context.getRequestData();
        List<String> recipients = context.getAdminEmails();

        if (recipients.isEmpty()) {
            // Replacing SITE_ADMIN_EMAIL from model.prop with ADMIN_EMAIL for model-config.xml
            LOG.error("ADMIN_EMAIL is not configured in model-config.xml; cannot send exception report.");
            return;
        }
        
        String from = "tomcat@" + requestData.getServerName();
        String subject = getEmailSubject(context);
        String message = getEmailBody(errors, context, logMarker);

        sendMail(recipients.toArray(new String[recipients.size()]), from, subject, message.toString());
    }

    private static String getEmailSubject(ErrorContext context) {
        return context.getProjectName() + " Site Error" + " - " + context.getRequestData().getRemoteHost();
    }

    private static String getEmailBody(ErrorBundle errors, ErrorContext context, String logMarker) {
        
        StringBuilder body = new StringBuilder();
        RequestData requestData = context.getRequestData();
        
        String errorUrl = getErrorUrl(requestData);
        body.append("Error on: " + (errorUrl == null ? "<unable to determine request URI>" : "\n  " + errorUrl) + "\n")
            .append("Remote Host: " + valueOrDefault(requestData.getRemoteHost(), "<not set>") + "\n")
            .append("Referred from: " + valueOrDefault(requestData.getReferrer(), "<not set>") + "\n")
            .append("UserAgent: " + "\n  " + requestData.getUserAgent() + "\n");
        
        // "JkEnvVar SERVER_ADDR" is required in Apache configuration
        body.append("Server Addr: " + valueOrDefault((String)requestData.getRequestAttribute("SERVER_ADDR"),
                "<not set; is 'JkEnvVar SERVER_ADDR' set in the Apache configuration?>") + "\n");

        body.append(PAGE_DIV).append("Request Parameters (request to the server)\n\n");
        body.append(getAttributeMapText(requestData.getTypedParamMap(), new ValueTransform<String[]>(){
            @Override public String transformValue(String key, String[] value) {
                return FormatUtil.arrayToString(value);
            }}));

        body.append(PAGE_DIV).append("Associated Request-Scope Attributes\n\n");
        body.append(getAttributeMapText(context.getRequestAttributeMap(), new ValueTransform<Object>(){
            @Override public String transformValue(String key, Object value) {
                return (key.toLowerCase().startsWith("email") ||
                        key.toLowerCase().startsWith("passw")) ? "*****" : value.toString();
            }}));
        
        body.append(PAGE_DIV).append("Session Attributes\n\n");
        body.append(getAttributeMapText(context.getSessionAttributeMap()));

        // body.append(PAGE_DIV).append("ServletContext Attributes\n\n");
        // body.append(getAttributeMapText(context.getServletContextAttributes()));

        body.append(PAGE_DIV).append("log4j marker: " + logMarker);

        body.append(PAGE_DIV).append("Stacktrace: \n\n")
            .append(valueOrDefault(getStackTraceAsText(errors), ""))
            .append("\n\n");

        return body.toString();
    }

    private static String getErrorUrl(RequestData requestData) {
        String requestURI = (String)requestData.getRequestAttribute("javax.servlet.forward.request_uri");
        String queryString = (String)requestData.getRequestAttribute("javax.servlet.forward.query_string");
        return (requestURI == null ? null :
            requestData.getNoContextUrl() + requestURI +
            (queryString == null ? "" : "?" + queryString));
    }
    
    private static void sendMail(String recipients[], String from, String subject, String message) {
        if (recipients.length == 0) return;
        try {
            Properties props = new Properties();
            props.put("mail.smtp.host", "localhost");

            Session session = Session.getDefaultInstance(props, null);
            session.setDebug(false);

            Message msg = new MimeMessage(session);
            InternetAddress addressFrom = new InternetAddress(from);

            List<InternetAddress> addressList = new ArrayList<InternetAddress>();
            for (int i = 0; i < recipients.length; i++) {
                try {
                    addressList.add(new InternetAddress(recipients[i]));
                } catch (AddressException ae) {
                    // ignore bad address
                }
            }
            InternetAddress[] addressTo = addressList.toArray(new InternetAddress[0]);

            msg.setRecipients(Message.RecipientType.TO, addressTo);
            msg.setFrom(addressFrom);
            msg.setSubject(subject);
            msg.setContent(message, "text/plain");

            Transport.send(msg);
        }
        catch (MessagingException me) {
            LOG.error(me);
        }
    }
    
    // archive the errors that were not emailed due to matched filter
    private static void writeFilteredErrorsToLog(ErrorBundle errors,
            ErrorContext context, String logMarker, String matchedFilterKey) {

        String filteredLogDirName = System.getProperty("catalina.base") + "/logs/filtered_errors";
        File filteredLogDir = new File(filteredLogDirName);

        if (!filteredLogDir.exists())
            filteredLogDir.mkdir();

        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd-HHmmss");
            String remoteHost = valueOrDefault(context.getRequestData().getRemoteHost(), "_");
            String logName = remoteHost + "-" + sdf.format(new Date());

            FileWriter fw = new FileWriter(filteredLogDirName + "/" + logName, true);
            BufferedWriter out = new BufferedWriter(fw);

            String from = "tomcat@" + context.getRequestData().getServerName();
            String subject = getEmailSubject(context);
            String message = getEmailBody(errors, context, logMarker);

            out.write("Filter Match: " + matchedFilterKey + "\n");
            out.write("Subject: " + subject + "\n");
            out.write("From: " + from + "\n");
            out.write(message + "\n");
            out.write("\n//\n");
            out.close();
        }
        catch (Exception e) {
            LOG.error(e);
        }
    }

    private void writeErrorSummaryToPage(WriterProvider writerProvider,
            ErrorBundle errors, String logMarker, boolean showStacktrace) {
        PrintWriter out = _writerProvider.getPrintWriter();

        String actionErrors = getActionErrorsAsHtml(errors.getActionErrors());
        if (!actionErrors.isEmpty()) {
            out.println("<br/>\n<em><b>Please correct the following error(s): </b></em><br/>\n" + actionErrors);
        }

        Exception wdkException = errors.getRequestException();
        if (wdkException != null && wdkException instanceof WdkException) {
            out.println("<br>\n<pre>\n" + ((WdkException)wdkException).formatErrors() + "\n</pre>\n\n");
        }

        if (_showStacktrace) {
            String st = getStackTraceAsText(errors);
            if (st != null) {
                out.println("<br>\n<pre>\n\n" + st + "\n</pre>\n");
            }
            out.println("log4j marker: " + _logMarker);
        }
    }
    
    private static String getActionErrorsAsHtml(List<String> actionErrors) {
        StringBuilder sb = new StringBuilder();
        for (String error : actionErrors) {
            // filter non-sensical errors
            if (!error.equals("???en_US.global.error.user???") &&
                !error.equals("???en_US.global.error.model???")) {
                sb.append("<li>" + error + "</li>\n");
            }
        }
        String errorList = sb.toString();
        return (errorList.isEmpty() ? "" : "<ul>\n" + errorList + "</ul>\n");
    }
    
    private static String getStackTraceAsText(ErrorBundle errors) {
        Exception pex = errors.getPageException();
        Exception rex = errors.getRequestException();
        Exception aex = errors.getActionException();

        if (pex == null && rex == null && aex == null)
            return null;

        StringBuilder st = new StringBuilder();

        if (rex != null) {
            st.append(stackTraceToString(rex));
            st.append("\n\n-- from pageContext.getException()\n");
        }
        if (pex != null) {
            st.append(stackTraceToString(pex));
            st.append("\n\n-- from request.getAttribute(Globals.EXCEPTION_KEY)\n");
        }
        if (aex != null) {
            st.append(stackTraceToString(aex));
            st.append("\n\n-- from request.getAttribute(CConstants.WDK_EXCEPTION)\n");
        }
        return st.toString();
    }

    /*************************** Utility functions ***************************/
    
    private static String stackTraceToString(Exception e) {
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }
    
    private static String valueOrDefault(String value, String defaultValue) {
        return (value == null ? defaultValue : value);
    }

    private static <T> String getAttributeMapText(Map<String, T> attributeMap) {
        return getAttributeMapText(attributeMap, new ValueTransform<T>());
    }
    
    private static <T> String getAttributeMapText(Map<String, T> attributeMap, ValueTransform<T> valueTransform) {
        StringBuilder sb = new StringBuilder();
        for (String key : attributeMap.keySet()) {
            sb.append(key + " = " + valueTransform.transformValue(key, attributeMap.get(key)) + "\n");
        }
        return sb.toString();
    }

}
