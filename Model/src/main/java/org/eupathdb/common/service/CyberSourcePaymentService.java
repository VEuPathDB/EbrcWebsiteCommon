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
import Invokers.ApiClient;
import Invokers.ApiException;
import Model.CreatePaymentRequest;
import Model.PtsV2PaymentsPost201Response;
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

    CyberSourceUtil.logPaymentEvent("payment-process", getRequestingUser(), referenceNumber, amount, currency, invoiceNumber);

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

      LOG.info("CyberSource payment result\t" + referenceNumber + "\t" + result.getStatus() + "\t" + result.getId());

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

  private static JSONObject parseInput(String body) {
    try {
      return new JSONObject(body);
    }
    catch (Exception e) {
      throw new BadRequestException("Request body must be a valid JSON object.");
    }
  }
}
