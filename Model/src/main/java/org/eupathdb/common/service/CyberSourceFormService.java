package org.eupathdb.common.service;

import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.TimeZone;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

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
import org.gusdb.fgputil.FormatUtil;
import org.gusdb.fgputil.IoUtil;
import org.gusdb.fgputil.MapBuilder;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.model.user.User;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONObject;

@Path("payment-form-content")
public class CyberSourceFormService extends AbstractWdkService {

  private static final Logger LOG = Logger.getLogger(CyberSourceFormService.class);

  private static final String CONFIG_FILE_LOCATION = "/home/rdoherty/cybersource.config.json";

  private static final Pattern MONEY_PATTERN = Pattern.compile("^[0-9]+(\\.[0-9][0-9])?$");

  private static final String HMAC_SHA256 = "HmacSHA256";

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Response generateCyberSourceForm(
      @QueryParam("amount") String amount,
      @QueryParam("currency") String currency
  ) {

    // validate and massage amount param
    amount = validateAmountParam(amount);
    currency = validateCurrencyParam(currency);

    // get values from config
    JSONObject config = readConfig();
    String accessKey = config.getString("access_key");
    String profileId = config.getString("profile_id");
    String secretKey = config.getString("secret_key");

    // reference number for tracking
    String referenceNumber = String.valueOf(new Date().getTime()) + getRandomDigits(5);
    logFormGeneration(getRequestingUser(), referenceNumber, amount, currency);

    // define a map containing the elements of the form
    Map<String,String> paramMap = new MapBuilder<String,String>()
        .put("unsigned_field_names","")
        .put("amount", amount)
        .put("profile_id", profileId)
        .put("access_key", accessKey)
        .put("currency", currency)
        .put("transaction_uuid", UUID.randomUUID().toString())
        .put("signed_field_names", "access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency")
        .put("locale", "en")
        .put("transaction_type", "authorization")
        .put("reference_number", referenceNumber)
        .put("signed_date_time", getUTCDateTime())
        .toMap();

    paramMap.put("signature", sign(buildDataToSign(paramMap), secretKey));

    return Response.ok(new JSONObject(paramMap).toString()).build();
  }

  private void logFormGeneration(User requestingUser, String referenceNumber, String amount, String currency) {
    LOG.info(Arrays.stream(new String[] {
        String.valueOf(requestingUser.getUserId()),
        "guest=" + requestingUser.isGuest(),
        referenceNumber,
        amount,
        currency
    }).map(s -> "\t" + s).collect(Collectors.joining()));
  }

  private static String sign(String data, String secretKey) {
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

  private static String buildDataToSign(Map<String,String> params) {
    String[] signedFieldNames = params.get("signed_field_names").split(",");
    List<String> dataToSign = new ArrayList<String>();
    for (String signedFieldName : signedFieldNames) {
        dataToSign.add(signedFieldName + "=" + params.get(signedFieldName));
    }
    return String.join(",", dataToSign);
  }

  private static String getRandomDigits(int numDigits) {
    Random rand = new Random();
    return IntStream.range(0,numDigits)
        .mapToObj(i -> String.valueOf(rand.nextInt(10)))
        .collect(Collectors.joining());
  }

  static String validateAmountParam(String amount) {
    if (amount == null || !(FormatUtil.isInteger(amount) || MONEY_PATTERN.matcher(amount).matches())) {
      throw new BadRequestException("'amount' parameter is required and must be a positive floating point number, in US Dollars.");
    }
    return amount.indexOf(".") == -1 ? amount + ".00" : amount;
  }

  static String validateCurrencyParam(String currency) {
    if (currency != null && !currency.toUpperCase().equals("USD")) {
      throw new BadRequestException("'currency' parameter, if passed, must be 'USD'; other currencies are not yet supported");
    }
    return "USD";
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
