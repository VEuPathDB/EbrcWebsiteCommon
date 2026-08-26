package org.eupathdb.common.service;

import java.util.Arrays;
import java.util.List;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONObject;

import com.cybersource.authsdk.core.MerchantConfig;

import Api.UnifiedCheckoutCaptureContextApi;
import Invokers.ApiClient;
import Model.GenerateUnifiedCheckoutCaptureContextRequest;
import Model.Upv1capturecontextsCaptureMandate;
import Model.Upv1capturecontextsCompleteMandate;
import Model.Upv1capturecontextsOrderInformation;
import Model.Upv1capturecontextsOrderInformationAmountDetails;

/**
 * The single GET endpoint takes a payment amount and currency and returns the
 * capture-context JWT that the client-side Unified Checkout JavaScript
 * library needs to render its embedded payment form, along with the
 * generated reference number (to be echoed back on the follow-up call to
 * {@link CyberSourcePaymentService}) and the URL (plus SRI integrity hash) of
 * the Unified Checkout JS asset to load, as extracted from the capture
 * context JWT itself (CyberSource docs require these NOT be hardcoded, since
 * they're unique per transaction).
 */
@Path("payment-form-context")
public class CyberSourceCaptureContextService extends AbstractWdkService {

  // model.prop property containing this site's base URL, e.g. https://plasmodb.org
  private static final String LOCALHOST_PROP_KEY = "LOCALHOST";

  // client version of the Unified Checkout JS library this capture context targets;
  // must match the version of the <script> asset loaded on the front end.
  // Front end must call createCheckout({ autoProcessing: false }) so that
  // checkout.mount() resolves with a transient token instead of completing
  // the transaction client-side (autoProcessing default changed in 0.30).
  private static final String CLIENT_VERSION = "0.30";

  private static final List<String> ALLOWED_CARD_NETWORKS = Arrays.asList(
      "VISA", "MASTERCARD", "AMEX", "DISCOVER", "DINERSCLUB", "JCB");

  private static final List<String> ALLOWED_PAYMENT_TYPES = Arrays.asList("PANENTRY");

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Response getCaptureContext(
      @QueryParam("amount") String amount,               // required; must match the pattern in CyberSourceUtil
      @QueryParam("currency") String currency,           // optional; defaults to USD
      @QueryParam("invoice_number") String invoiceNumber // optional; logged with reference number for traceability
  ) {
    amount = CyberSourceUtil.validateAmountParam(amount);
    currency = CyberSourceUtil.validateCurrencyParam(currency);
    invoiceNumber = CyberSourceUtil.validateInvoiceNumber(invoiceNumber);

    String referenceNumber = CyberSourceUtil.generateReferenceNumber();
    CyberSourceLogger.logPaymentEvent("capture-context", getRequestingUser(), referenceNumber, amount, currency, invoiceNumber);

    JSONObject config = CyberSourceUtil.readConfig();
    String localhost = getLocalhostUrl();

    GenerateUnifiedCheckoutCaptureContextRequest requestObj = new GenerateUnifiedCheckoutCaptureContextRequest();
    requestObj.clientVersion(CLIENT_VERSION);
    requestObj.targetOrigins(Arrays.asList(localhost));
    requestObj.allowedCardNetworks(ALLOWED_CARD_NETWORKS);
    requestObj.allowedPaymentTypes(ALLOWED_PAYMENT_TYPES);
    requestObj.country("US");
    requestObj.locale("en_US");

    Upv1capturecontextsCaptureMandate captureMandate = new Upv1capturecontextsCaptureMandate();
    captureMandate.billingType("FULL");
    captureMandate.requestEmail(true);
    captureMandate.requestPhone(false);
    captureMandate.requestShipping(false);
    captureMandate.showAcceptedNetworkIcons(true);
    captureMandate.showConfirmationStep(true);
    requestObj.captureMandate(captureMandate);

    Upv1capturecontextsOrderInformation orderInformation = new Upv1capturecontextsOrderInformation();
    Upv1capturecontextsOrderInformationAmountDetails amountDetails = new Upv1capturecontextsOrderInformationAmountDetails();
    amountDetails.totalAmount(amount);
    amountDetails.currency(currency);
    orderInformation.amountDetails(amountDetails);
    requestObj.orderInformation(orderInformation);

    Upv1capturecontextsCompleteMandate completeMandate = new Upv1capturecontextsCompleteMandate();
    completeMandate.setType("CAPTURE");
    completeMandate.setDecisionManager(false);
    requestObj.setCompleteMandate(completeMandate);

    try {
      MerchantConfig merchantConfig = CyberSourceUtil.buildMerchantConfig(config);
      ApiClient apiClient = new ApiClient();
      apiClient.merchantConfig = merchantConfig;

      UnifiedCheckoutCaptureContextApi apiInstance = new UnifiedCheckoutCaptureContextApi(apiClient);
      String captureContextJwt = apiInstance.generateUnifiedCheckoutCaptureContext(requestObj);

      // Per CyberSource docs, the JS library URL and its SRI hash must be read
      // out of the capture context JWT itself (ctx[0].data.clientLibrary /
      // clientLibraryIntegrity) rather than hardcoded/guessed, since they are
      // unique to each transaction and can change without notice.
      JSONObject ctxData = CyberSourceUtil.decodeJwtPayload(captureContextJwt)
          .getJSONArray("ctx").getJSONObject(0).getJSONObject("data");

      JSONObject responseJson = new JSONObject()
          .put("captureContext", captureContextJwt)
          .put("referenceNumber", referenceNumber)
          .put("scriptUrl", ctxData.getString("clientLibrary"))
          .put("scriptIntegrity", ctxData.optString("clientLibraryIntegrity", null));

      return Response.ok(responseJson.toString()).build();
    }
    catch (Exception e) {
      throw new WdkRuntimeException("Unable to generate CyberSource capture context", e);
    }
  }

  private String getLocalhostUrl() {
    String localhost = getWdkModel().getProperties().get(LOCALHOST_PROP_KEY);
    if (localhost == null) {
      throw new WdkRuntimeException(new WdkModelException("model.prop must contain the property: " + LOCALHOST_PROP_KEY));
    }
    return localhost;
  }

}
