package org.eupathdb.common.service;

import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.Random;
import java.util.TimeZone;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.IoUtil;
import org.gusdb.fgputil.MapBuilder;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.model.user.User;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONObject;

/**
 * The single GET endpoint takes a payment amount and currency and returns a
 * JSON object where the keys/values represent all the form input fields
 * required by CyberSource to being their checkout sequence.  Web client code
 * is responsible for converting this object to a form and submitting it to
 * the appropriate CyberSource endpoint.
 */
@Path("payment-form-content")
public class CyberSourceFormService extends AbstractWdkService {

  private static final Logger LOG = Logger.getLogger(CyberSourceFormService.class);

  // location of file containing cybersource account values and signing key
  private static final String CONFIG_FILE_LOCATION = "/usr/local/tomcat_instances/shared/.cybersource.config.json";

  // regex to recognize proper amount values
  private static final Pattern MONEY_PATTERN = Pattern.compile("^[0-9]+(\\.[0-9][0-9])?$");

  // regex to recognize proper invoice numbers
  private static final Pattern INVOICE_NUMBER_PATTERN = Pattern.compile("^[0-9A-Za-z\\-]+$");

  // signing algorithm
  private static final String HMAC_SHA256 = "HmacSHA256";

  // will appear in log when invoice param not sent or empty
  static final String INVOICE_NOT_SPECIFIED = "Not_Specified";

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Response generateCyberSourceForm(
      @QueryParam("amount") String amount,               // required; must match the pattern above
      @QueryParam("currency") String currency,           // optional; defaults to USD
      @QueryParam("invoice_number") String invoiceNumber // optional; logged with reference number for trackability
  ) {

    // validate and massage amount and currency params
    amount = validateAmountParam(amount);
    currency = validateCurrencyParam(currency);
    invoiceNumber = validateInvoiceNumber(invoiceNumber);

    // get values from config
    JSONObject config = readConfig();
    String accessKey = config.getString("access_key");
    String profileId = config.getString("profile_id");
    String secretKey = config.getString("secret_key");

    // reference number for tracking (add 5 random digits at each ms)
    String referenceNumber = String.valueOf(new Date().getTime()) +
        String.format("%05d", new Random().nextInt(100000));
    logFormGeneration(getRequestingUser(), referenceNumber, amount, currency, invoiceNumber);

    // define a map containing the elements of the form
    Map<String,String> paramMap = new MapBuilder<String,String>()
        .put("signed_field_names", "access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency")
        .put("unsigned_field_names","")
        .put("locale", "en")
        .put("signed_date_time", getUTCDateTime())
        .put("reference_number", referenceNumber)
        .put("transaction_type", "authorization")
        .put("transaction_uuid", UUID.randomUUID().toString())
        .put("profile_id", profileId)
        .put("access_key", accessKey)
        .put("amount", amount)
        .put("currency", currency)
        .toMap();

    // calculate signature from the exising fields and add to the form map
    paramMap.put("signature", getSignature(paramMap, secretKey));

    return Response.ok(new JSONObject(paramMap).toString()).build();
  }

  private static void logFormGeneration(User requestingUser, String referenceNumber, String amount, String currency, String invoiceNumber) {
    LOG.info(Stream.of(
        String.valueOf(requestingUser.getUserId()),
        "guest=" + requestingUser.isGuest(),
        referenceNumber,
        amount,
        currency,
        invoiceNumber
    ).collect(Collectors.joining("\t", "\t", "")));
  }

  private static String getSignature(Map<String,String> params, String secretKey) {

    // aggregate data into comma-delimited key=value pairs
    String data = Arrays
        .stream(params.get("signed_field_names").split(","))
        .map(name -> name + "=" + params.get(name))
        .collect(Collectors.joining(","));

    // generate the signature and return
    try {
      SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(), HMAC_SHA256);
      Mac mac = Mac.getInstance(HMAC_SHA256);
      mac.init(secretKeySpec);
      byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
      return new String(Base64.getEncoder().encode(rawHmac), StandardCharsets.UTF_8);
    }
    catch (InvalidKeyException | NoSuchAlgorithmException e) {
      throw new WdkRuntimeException("Unable to sign cybersource form", e);
    }
  }

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

  private static String getUTCDateTime() {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
    sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
    return sdf.format(new Date());
  }

  private static JSONObject readConfig() {
    try (Reader in = new FileReader(CONFIG_FILE_LOCATION)) {
      return new JSONObject(IoUtil.readAllChars(in));
    }
    catch (IOException e) {
      throw new WdkRuntimeException("Unable to read/parse config file at: " + CONFIG_FILE_LOCATION, e);
    }
  }
}
