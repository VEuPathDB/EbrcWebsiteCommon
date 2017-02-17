package org.eupathdb.common.errors;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
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
import org.gusdb.fgputil.runtime.GusHome;
import org.gusdb.fgputil.web.RequestData;
import org.gusdb.wdk.errors.ErrorBundle;
import org.gusdb.wdk.errors.ErrorContext;
import org.gusdb.wdk.errors.ErrorContext.RequestType;

public class ErrorHandler {

  private static Logger LOG = Logger.getLogger(ErrorHandler.class);

  // file defining error filters (relative to gus_home)
  private static final String FILTER_FILE = "config/errorsTag.filter";

  private static final String PAGE_DIV = "\n************************************************\n";

  // special logs to write ignored (i.e. filtered) and retained errors
  private static class IgnoredErrorLog {
    @SuppressWarnings("hiding")
    public static final Logger LOG = Logger.getLogger(IgnoredErrorLog.class);
  }

  private static class RetainedErrorLog {
    @SuppressWarnings("hiding")
    public static final Logger LOG = Logger.getLogger(RetainedErrorLog.class);
  }

  /**
   * Converts an arbitrary type to a string with the assistance of a qualifier
   * 
   * @param <T>
   *          type of value being stringified
   */
  private static class Stringifier<T> {
    /**
     * @param value
     *          value to be stringified
     * @param qualifier
     *          indicator to help stringify
     */
    public String stringify(T value, String qualifier) {
      return value.toString();
    }
  }

  private final ErrorBundle _errors;
  private final ErrorContext _context;
  private final Properties _filters;

  public ErrorHandler(ErrorBundle errors, ErrorContext context, Properties filters) {
    _errors = errors;
    _context = context;
    _filters = filters;
  }

  public void handleError() {

    // do nothing and return if no errors
    if (!_errors.hasErrors())
      return;

    // check to see if this error matches a filter
    String matchedFilterKey = filterMatch(_errors, _context.getRequestData(), _filters);

    // take action on this error depending on context and filter match
    Logger errorLog = (matchedFilterKey != null ? IgnoredErrorLog.LOG : RetainedErrorLog.LOG);
    errorLog.error(getErrorText(_errors, _context, matchedFilterKey));

    if (matchedFilterKey == null && _context.isSiteMonitored()) {
      // error did not match filters
      constructAndSendMail(_errors, _context);
    }
  }

  private static String getErrorText(ErrorBundle errors, ErrorContext context, String matchedFilterKey) {

    StringBuilder errorText = new StringBuilder();
    String from = "tomcat@" + context.getRequestData().getServerName();
    String subject = getEmailSubject(context);
    String message = getEmailBody(errors, context);

    return errorText
        .append("Filter Match: " + matchedFilterKey + "\n")
        .append("Subject: " + subject + "\n")
        .append("From: " + from + "\n")
        .append(message + "\n")
        .append("\n//\n").toString();
  }

  /**
   * Check for matches to filters. Filters are regular expressions in a property file. The file is optional.
   * In which case, no filtering is performed.
   * 
   * Matches are checked against the text of errors and stacktraces.
   * 
   * Property file example 1. A simple check for missing step ids.
   * 
   * noStepForUser = The Step #\\d+ of user .+ doesn't exist
   * 
   * Compound filtering can be configured with specific subkeys in the property file (the primary key is
   * always required).
   * 
   * Property file example 2. Filter when exceptions contain the words "twoPartName is null" and also the
   * referer is empty.
   * 
   * twoPartNameIsNull = twoPartName is null twoPartNameIsNull.referer =
   * 
   * Allowed subkeys are referer ip
   **/
  private static String filterMatch(ErrorBundle errors, RequestData requestData, Properties filters) {

    StringBuilder allErrors = new StringBuilder();
    allErrors.append(errors.getStackTraceAsText());
    allErrors.append(errors.getActionErrorsAsHtml());
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
         * Found match for primary filter. Now check for additional matches from any subkey filters. Return on
         * first match.
         **/
        boolean checkedSubkeys = false;
        String refererFilter = filters.getProperty(key + ".referer");
        String ipFilter = filters.getProperty(key + ".ip");

        if (refererFilter != null) {
          checkedSubkeys = true;
          String referer = valueOrDefault(requestData.getReferrer(), "");
          if (refererFilter.equals(referer))
            return key + " = " + regex + " AND " + key + ".referer = " + refererFilter;
        }

        if (ipFilter != null) {
          checkedSubkeys = true;
          String remoteHost = valueOrDefault(requestData.getRemoteHost(), "");
          if (ipFilter.equals(remoteHost))
            return key + " = " + regex + " AND " + key + ".ip = " + ipFilter;
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

  /**
   * Loads filters from config file into Properties object
   * 
   * @param context
   *          context to use to fetch resource
   * @return properties object containing filters
   * @throws IOException
   *           if unable to load filters
   */
  public static Properties getErrorFilters() throws IOException {
    Path filterFile = Paths.get(GusHome.getGusHome(), FILTER_FILE);
    Properties filters = new Properties();
    try (InputStream is = new FileInputStream(filterFile.toFile())) {
      filters.load(is);
    }
    return filters;
  }

  private static void constructAndSendMail(ErrorBundle errors, ErrorContext context) {

    RequestData requestData = context.getRequestData();
    List<String> recipients = context.getAdminEmails();

    String from = "tomcat@" + requestData.getServerName();
    String subject = getEmailSubject(context);
    String message = getEmailBody(errors, context);

    sendMail(recipients, from, subject, message.toString());
  }

  private static String getEmailSubject(ErrorContext context) {
    String source = context.getRequestType().equals(RequestType.WDK_SITE) ? "Site" : "Service";
    return context.getProjectName() + " " + source + " Error" + " - " +
        context.getRequestData().getRemoteHost();
  }

  private static String getEmailBody(ErrorBundle errors, ErrorContext context) {

    StringBuilder body = new StringBuilder();
    RequestData requestData = context.getRequestData();

    String errorUrl = getErrorUrl(requestData);
    body.append("Error on: " + (errorUrl == null ? "<unable to determine request URI>" : "\n  " + errorUrl) +
        "\n").append(
            "Remote Host: " + valueOrDefault(requestData.getRemoteHost(), "<not set>") + "\n").append(
                "Referred from: " + valueOrDefault(requestData.getReferrer(), "<not set>") + "\n").append(
                    "UserAgent: " + "\n  " + requestData.getUserAgent() + "\n");

    // "JkEnvVar SERVER_ADDR" is required in Apache configuration
    body.append("Server Addr: " + valueOrDefault((String) requestData.getRequestAttribute("SERVER_ADDR"),
        "<not set; is 'JkEnvVar SERVER_ADDR' set in the Apache configuration?>") + "\n");

    body.append(PAGE_DIV).append("Request Parameters (request to the server)\n\n");
    body.append(getAttributeMapText(requestData.getTypedParamMap(), new Stringifier<String[]>() {
      @Override
      public String stringify(String[] value, String qualifier) {
        return FormatUtil.arrayToString(value);
      }
    }));

    body.append(PAGE_DIV).append("Associated Request-Scope Attributes\n\n");
    body.append(getAttributeMapText(context.getRequestAttributeMap(), new Stringifier<Object>() {
      @Override
      public String stringify(Object value, String key) {
        return (key.toLowerCase().startsWith("email") || key.toLowerCase().startsWith("passw")) ? "*****"
            : value.toString();
      }
    }));

    body.append(PAGE_DIV).append("Session Attributes\n\n");
    body.append(getAttributeMapText(context.getSessionAttributeMap()));

    // body.append(PAGE_DIV).append("ServletContext Attributes\n\n");
    // body.append(getAttributeMapText(context.getServletContextAttributes()));

    body.append(PAGE_DIV).append("log4j marker: " + context.getLogMarker());

    body.append(PAGE_DIV).append("Stacktrace: \n\n").append(
        valueOrDefault(errors.getStackTraceAsText(), "")).append("\n\n");

    return body.toString();
  }

  private static String getErrorUrl(RequestData requestData) {
    String requestURI = (String) requestData.getRequestAttribute("javax.servlet.forward.request_uri");
    String queryString = (String) requestData.getRequestAttribute("javax.servlet.forward.query_string");
    return (requestURI == null ? null
        : requestData.getNoContextUrl() + requestURI + (queryString == null ? "" : "?" + queryString));
  }

  private static void sendMail(List<String> recipients, String from, String subject, String message) {
    if (recipients.isEmpty()) {
      // Replacing SITE_ADMIN_EMAIL from model.prop with ADMIN_EMAIL for model-config.xml
      LOG.error("ADMIN_EMAIL is not configured in model-config.xml; cannot send exception report.");
      return;
    }
    try {
      Properties props = new Properties();
      props.put("mail.smtp.host", "localhost");

      Session session = Session.getDefaultInstance(props, null);
      session.setDebug(false);

      Message msg = new MimeMessage(session);
      InternetAddress addressFrom = new InternetAddress(from);

      List<InternetAddress> addressList = new ArrayList<InternetAddress>();
      for (String address : recipients) {
        try {
          addressList.add(new InternetAddress(address));
        }
        catch (AddressException ae) {
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

  /*************************** Utility functions ***************************/

  private static String valueOrDefault(String value, String defaultValue) {
    return (value == null ? defaultValue : value);
  }

  private static <T> String getAttributeMapText(Map<String, T> attributeMap) {
    return getAttributeMapText(attributeMap, new Stringifier<T>());
  }

  private static <T> String getAttributeMapText(Map<String, T> attributeMap, Stringifier<T> stringifier) {
    StringBuilder sb = new StringBuilder();
    for (String key : attributeMap.keySet()) {
      sb.append(key + " = " + stringifier.stringify(attributeMap.get(key), key) + "\n");
    }
    return sb.toString();
  }

}
