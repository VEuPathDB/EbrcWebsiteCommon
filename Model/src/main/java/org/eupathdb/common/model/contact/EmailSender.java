package org.eupathdb.common.model.contact;

import javax.activation.DataHandler;

import org.gusdb.wdk.model.WdkModelException;

public interface EmailSender {
  public void sendEmail(String smtpServer, String sendTos, String reply,
      String subject, String content, String ccAddresses,
      DataHandler[] attachments) throws WdkModelException;
}
