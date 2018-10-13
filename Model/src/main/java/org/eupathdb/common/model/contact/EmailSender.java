package org.eupathdb.common.model.contact;

import org.gusdb.wdk.model.Attachment;
import org.gusdb.wdk.model.WdkModelException;

@FunctionalInterface
public interface EmailSender {
  public void sendEmail(String smtpServer, String sendTos, String reply,
      String subject, String content, String ccAddresses,
      Attachment[] attachments) throws WdkModelException;
}
