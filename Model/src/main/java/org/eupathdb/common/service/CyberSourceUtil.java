package org.eupathdb.common.service;

import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.util.Date;
import java.util.Properties;
import java.util.Random;
import java.util.regex.Pattern;

import javax.ws.rs.BadRequestException;

import org.gusdb.fgputil.IoUtil;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.json.JSONObject;

import com.cybersource.authsdk.core.ConfigException;
import com.cybersource.authsdk.core.MerchantConfig;

/**
 * Shared config/validation/logging support for the Unified Checkout capture
 * context and payment-processing services. The config file at
 * {@link #CONFIG_FILE_LOCATION} is expected to contain the following keys.
 * merchant_id and run_environment come from CyberSource Business Center; the
 * key_* fields describe the P12 key file (generated in Business Center under
 * Payment Configuration -> Key Management -> API Keys -> JWT) used to sign
 * the JWT for authentication. The response_mle_* fields are optional and, if
 * present, describe a *separate* P12 key pair (Business Center -> Key
 * Management -> API Keys -> REST - API Response MLE) used to decrypt
 * CyberSource's encrypted API responses; enable_request_mle optionally turns
 * on encryption of our outgoing requests, using a cert normally
 * auto-extracted from the auth P12 above (override via
 * request_mle_cert_path/request_mle_key_alias if that P12 wasn't generated
 * with an embedded MLE cert). CyberSource is making the updated MLE version
 * mandatory across the platform by September 2026, so both should be
 * configured before then even though they're optional here:
 *
 * <pre>
 * {
 *   "merchant_id": "...",
 *   "run_environment": "apitest.cybersource.com", // or "api.cybersource.com" in production
 *   "keys_directory": "/usr/local/tomcat_instances/shared",
 *   "key_file_name": "...", // .p12 filename, without the .p12 extension
 *   "key_alias": "...",
 *   "key_password": "...",
 *   "enable_request_mle": true,
 *   "request_mle_cert_path": "...",   // optional override
 *   "request_mle_key_alias": "...",   // optional override
 *   "response_mle_key_path": "...",   // path to the separate response-MLE .p12
 *   "response_mle_key_password": "...",
 *   "response_mle_kid": "..."         // optional; required only for non-P12 key formats
 * }
 * </pre>
 */
class CyberSourceUtil {

  // location of file containing cybersource REST API credentials
  private static final String CONFIG_FILE_LOCATION = "/usr/local/tomcat_instances/shared/.cybersource.config.json";

  // regex to recognize proper amount values
  private static final Pattern MONEY_PATTERN = Pattern.compile("^[0-9]+(\\.[0-9][0-9])?$");

  // regex to recognize proper invoice/reference numbers
  private static final Pattern INVOICE_NUMBER_PATTERN = Pattern.compile("^[0-9A-Za-z\\-]+$");

  // will appear in log when invoice param not sent or empty
  static final String INVOICE_NOT_SPECIFIED = "Not_Specified";

  private static final String TEST_RUN_ENVIRONMENT = "apitest.cybersource.com";

  static String validateAmountParam(String amount) {
    if (amount == null || !MONEY_PATTERN.matcher(amount).matches()) {
      throw new BadRequestException("'amount' parameter is required and represent a numeric payment amount in US Dollars.");
    }
    return amount.indexOf(".") == -1 ? amount + ".00" : amount;
  }

  // TODO: in the future we will probably support multiple currencies
  static String validateCurrencyParam(String currency) {
    if (currency != null && !currency.toUpperCase().equals("USD")) {
      throw new BadRequestException("'currency' parameter, if passed, must be 'USD'; other currencies are not yet supported");
    }
    return "USD";
  }

  static String validateInvoiceNumber(String invoiceNumber) {
    if (invoiceNumber == null || invoiceNumber.isBlank()) {
      return INVOICE_NOT_SPECIFIED;
    }
    if (INVOICE_NUMBER_PATTERN.matcher(invoiceNumber).matches()) {
      return invoiceNumber;
    }
    throw new BadRequestException("'invoice_number' parameter is malformed; only alphanumeric and hyphen characters are allowed");
  }

  static String validateReferenceNumber(String referenceNumber) {
    if (referenceNumber == null || !INVOICE_NUMBER_PATTERN.matcher(referenceNumber).matches()) {
      throw new BadRequestException("'reference_number' parameter is required and must match the value returned by the capture-context request.");
    }
    return referenceNumber;
  }

  static String validateTransientToken(String transientToken) {
    if (transientToken == null || transientToken.isBlank()) {
      throw new BadRequestException("'transient_token' parameter is required.");
    }
    return transientToken;
  }

  // reference number for tracking (add 5 random digits at each ms)
  static String generateReferenceNumber() {
    return String.valueOf(new Date().getTime()) +
        String.format("%05d", new Random().nextInt(100000));
  }

  static JSONObject readConfig() {
    try (Reader in = new FileReader(CONFIG_FILE_LOCATION)) {
      return new JSONObject(IoUtil.readAllChars(in));
    }
    catch (IOException e) {
      throw new WdkRuntimeException("Unable to read/parse config file at: " + CONFIG_FILE_LOCATION, e);
    }
  }

  static boolean isTestEnvironment(JSONObject config) {
    return TEST_RUN_ENVIRONMENT.equals(config.getString("run_environment"));
  }

  static MerchantConfig buildMerchantConfig(JSONObject config) {
    Properties props = new Properties();
    // JWT auth signed with a P12 key pair (HTTP Signature is deprecated).
    props.setProperty("authenticationType", "jwt");
    props.setProperty("merchantID", config.getString("merchant_id"));
    props.setProperty("runEnvironment", config.getString("run_environment"));
    props.setProperty("keysDirectory", config.getString("keys_directory"));
    props.setProperty("keyFileName", config.getString("key_file_name"));
    props.setProperty("keyAlias", config.getString("key_alias"));
    props.setProperty("keyPass", config.getString("key_password"));
    props.setProperty("enableLog", "false");

    // Request MLE: encrypts the JSON we send to CyberSource. The cert is
    // auto-extracted from the auth P12 above (via the default
    // "CyberSource_SJC_US" alias) unless overridden below.
    if (config.optBoolean("enable_request_mle", false)) {
      props.setProperty("enableRequestMLEForOptionalApisGlobally", "true");
      if (config.has("request_mle_cert_path")) {
        props.setProperty("mleForRequestPublicCertPath", config.getString("request_mle_cert_path"));
      }
      if (config.has("request_mle_key_alias")) {
        props.setProperty("requestMleKeyAlias", config.getString("request_mle_key_alias"));
      }
    }

    // Response MLE: decrypts CyberSource's JSON responses using the
    // dedicated "REST - API Response MLE" P12 key pair (separate from the
    // auth key pair above).
    if (config.has("response_mle_key_path")) {
      props.setProperty("enableResponseMleGlobally", "true");
      props.setProperty("responseMlePrivateKeyFilePath", config.getString("response_mle_key_path"));
      props.setProperty("responseMlePrivateKeyFilePassword", config.getString("response_mle_key_password"));
      if (config.has("response_mle_kid")) {
        props.setProperty("responseMleKID", config.getString("response_mle_kid"));
      }
    }

    try {
      return new MerchantConfig(props);
    }
    catch (ConfigException e) {
      throw new WdkRuntimeException("Invalid CyberSource merchant configuration", e);
    }
  }
}
