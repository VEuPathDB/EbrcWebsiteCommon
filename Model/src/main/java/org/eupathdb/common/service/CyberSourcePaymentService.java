package org.eupathdb.common.service;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONObject;

import com.cybersource.authsdk.core.MerchantConfig;

import Api.PaymentsApi;
import Api.TransientTokenDataV2Api;
import Invokers.ApiClient;
import Invokers.ApiException;
import Model.CreatePaymentRequest;
import Model.PtsV2PaymentsPost201Response;
import Model.PtsV2PaymentsPost201ResponseOrderInformation;
import Model.PtsV2PaymentsPost201ResponseOrderInformationAmountDetails;
import Model.Ptsv2paymentsClientReferenceInformation;
import Model.Ptsv2paymentsOrderInformation;
import Model.Ptsv2paymentsOrderInformationAmountDetails;
import Model.Ptsv2paymentsTokenInformation;

/**
 * Takes the transient token returned by the Unified Checkout JS widget (once
 * the donor has entered their payment info in CyberSource's embedded iframe)
 * along with the amount/currency/reference-number originally used to build
 * the capture context, and performs the actual server-to-server authorize +
 * capture ("sale") against CyberSource's Payments API. Card data is never
 * present in this request; the transient token is an opaque, short-lived
 * (~15 min) reference to it.
 */
@Path("payment-process")
public class CyberSourcePaymentService extends AbstractWdkService {

  private static final Logger LOG = Logger.getLogger(CyberSourcePaymentService.class);

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response processPayment(String body) {

    JSONObject input = parseInput(body);

    String amount = CyberSourceUtil.validateAmountParam(input.optString("amount", null));
    String currency = CyberSourceUtil.validateCurrencyParam(input.optString("currency", null));
    String invoiceNumber = CyberSourceUtil.validateInvoiceNumber(input.optString("invoiceNumber", null));
    String referenceNumber = CyberSourceUtil.validateReferenceNumber(input.optString("referenceNumber", null));
    String transientToken = CyberSourceUtil.validateTransientToken(input.optString("transientToken", null));

    CyberSourceLogger.logPaymentEvent("payment-process", getRequestingUser(), referenceNumber, amount, currency, invoiceNumber);

    JSONObject config = CyberSourceUtil.readConfig();

    CreatePaymentRequest requestObj = new CreatePaymentRequest();

    Ptsv2paymentsClientReferenceInformation clientReferenceInformation = new Ptsv2paymentsClientReferenceInformation();
    clientReferenceInformation.code(referenceNumber);
    requestObj.clientReferenceInformation(clientReferenceInformation);

    Ptsv2paymentsOrderInformation orderInformation = new Ptsv2paymentsOrderInformation();
    Ptsv2paymentsOrderInformationAmountDetails amountDetails = new Ptsv2paymentsOrderInformationAmountDetails();
    amountDetails.totalAmount(amount);
    amountDetails.currency(currency);
    orderInformation.amountDetails(amountDetails);
    requestObj.orderInformation(orderInformation);

    Ptsv2paymentsTokenInformation tokenInformation = new Ptsv2paymentsTokenInformation();
    tokenInformation.transientTokenJwt(transientToken);
    requestObj.tokenInformation(tokenInformation);

    try {
      MerchantConfig merchantConfig = CyberSourceUtil.buildMerchantConfig(config);
      ApiClient apiClient = new ApiClient();
      apiClient.merchantConfig = merchantConfig;

      PaymentsApi apiInstance = new PaymentsApi(apiClient);
      PtsV2PaymentsPost201Response result = apiInstance.createPayment(requestObj);

      // log in wdk.log, payment log, and DB to support metrics and later user receipt lookup
      LOG.info("CyberSource payment result\t" + referenceNumber + "\t" + result.getStatus() + "\t" + result.getId());
      CyberSourceLogger.logPaymentEvent("payment-complete", getRequestingUser(), referenceNumber, amount, currency, invoiceNumber);

      JSONObject tokenDetails = fetchTransientTokenDetails(apiClient, transientToken, referenceNumber);
      new PaymentsClient(getWdkModel().getModelConfig()).insertPayment(paymentFromCyberSourceResult(result, tokenDetails));

      JSONObject responseJson = new JSONObject()
          .put("status", result.getStatus())
          .put("transactionId", result.getId())
          .put("referenceNumber", referenceNumber);

      return Response.ok(responseJson.toString()).build();
    }
    catch (ApiException e) {
      LOG.error("CyberSource payment API error for reference " + referenceNumber + ": HTTP " + e.getCode() + " " + e.getResponseBody(), e);
      throw new WdkRuntimeException("Unable to process CyberSource payment", e);
    }
    catch (Exception e) {
      throw new WdkRuntimeException("Unable to process CyberSource payment", e);
    }
  }

  /**
   * The createPayment response above does not echo back the billing name/
   * email/address captured by the Unified Checkout widget (confirmed by
   * inspection -- those fields come back null). CyberSource requires a
   * second, separate call keyed by the {@code jti} claim inside the
   * transient token JWT to retrieve them:
   * https://developer.cybersource.com/docs/cybs/en-us/unified-checkout/developer/all/rest/unified-checkout/uc-token-get-pymnt-details.html
   * The generated SDK wrapper for this call (TransientTokenDataV2Api
   * .getTransactionForTransientTokenJTI) discards the response body (it
   * calls apiClient.execute(call) with a null returnType), so the call is
   * built and executed manually here instead. Failures are logged but not
   * fatal -- the payment itself has already succeeded by the time this runs.
   */
  private static JSONObject fetchTransientTokenDetails(ApiClient apiClient, String transientToken, String referenceNumber) {
    try {
      String jti = CyberSourceUtil.decodeJwtPayload(transientToken).getString("jti");
      TransientTokenDataV2Api tokenApi = new TransientTokenDataV2Api(apiClient);
      okhttp3.Call call = tokenApi.getTransactionForTransientTokenJTICall(jti, null, null);
      String rawJson = apiClient.<String>execute(call, String.class).getData();
      LOG.info("CyberSource transient token details\t" + referenceNumber + "\t" + rawJson);
      return new JSONObject(rawJson);
    }
    catch (Exception e) {
      LOG.error("Unable to retrieve transient token payment details for reference " + referenceNumber, e);
      return new JSONObject();
    }
  }

  /**
   * The OAuth server this Payment is sent to (see {@link PaymentsClient})
   * requires every field, so any value CyberSource didn't return is set to
   * an empty string rather than left null (Payment's NON_NULL Jackson
   * setting would otherwise drop the field from the JSON entirely).
   */
  private static Payment paymentFromCyberSourceResult(PtsV2PaymentsPost201Response result, JSONObject tokenDetails) {
    PtsV2PaymentsPost201ResponseOrderInformation orderInformation = result.getOrderInformation();
    PtsV2PaymentsPost201ResponseOrderInformationAmountDetails amountDetails =
        orderInformation == null ? null : orderInformation.getAmountDetails();

    // Confirmed present in the payment-details response's billTo (see logged
    // raw JSON in fetchTransientTokenDetails above): firstName, lastName,
    // country, address1, postalCode, locality, administrativeArea, email
    // (also buildingNumber, unused here). address2 was not present on that
    // transaction, but is parsed in case it appears on others (e.g.
    // apartment/suite number).
    JSONObject tokenOrderInformation = tokenDetails.optJSONObject("orderInformation");
    JSONObject tokenBillTo = tokenOrderInformation == null ? null : tokenOrderInformation.optJSONObject("billTo");
    if (tokenBillTo == null) {
      tokenBillTo = new JSONObject();
    }

    return new Payment()
        .setReferenceNumber(orEmpty(result.getReconciliationId()))
        .setPaymentDateTimeISO8601(orEmpty(result.getSubmitTimeUtc()))
        .setAmount(amountDetails == null ? "" : orEmpty(amountDetails.getTotalAmount()))
        .setFirstName(tokenBillTo.optString("firstName", ""))
        .setLastName(tokenBillTo.optString("lastName", ""))
        .setAddress1(tokenBillTo.optString("address1", ""))
        .setAddress2(tokenBillTo.optString("address2", ""))
        .setCity(tokenBillTo.optString("locality", ""))
        .setPostalCode(tokenBillTo.optString("postalCode", ""))
        .setState(tokenBillTo.optString("administrativeArea", ""))
        .setEmail(tokenBillTo.optString("email", ""))
        .setCountry(tokenBillTo.optString("country", ""));
  }

  private static String orEmpty(String value) {
    return value == null ? "" : value;
  }

  private static JSONObject parseInput(String body) {
    try {
      return new JSONObject(body);
    }
    catch (Exception e) {
      throw new BadRequestException("Request body must be a valid JSON object.");
    }
  }
}
