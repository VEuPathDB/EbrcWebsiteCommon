package org.eupathdb.common.service;

import org.apache.log4j.Logger;
import org.gusdb.wdk.model.user.User;

public class CyberSourceLogger {

  private static final Logger LOG = Logger.getLogger(CyberSourceLogger.class);

  static void logPaymentEvent(String stage, User requestingUser, String referenceNumber, String amount, String currency, String invoiceNumber) {
    LOG.info(String.join("\t",
        stage,
        String.valueOf(requestingUser.getUserId()),
        "guest=" + requestingUser.isGuest(),
        referenceNumber,
        amount,
        currency,
        invoiceNumber
    ));
  }
}
