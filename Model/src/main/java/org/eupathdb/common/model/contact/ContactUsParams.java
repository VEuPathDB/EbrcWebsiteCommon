package org.eupathdb.common.model.contact;

import javax.activation.DataHandler;

// TODO: Should we factor out this "concretion"
// using an interface?
public class ContactUsParams {
  public final String subject;
  public final String reporterEmail;
  public final String[] ccEmails;
  public final String message;
  public final DataHandler[] attachments;
  
  public ContactUsParams(
      String subject,
      String reporterEmail,
      String[] ccEmails,
      String message,
      DataHandler[] attachments) {
    this.subject = subject;
    this.reporterEmail = reporterEmail;
    this.ccEmails = ccEmails;
    this.message = message;
    this.attachments = attachments;
  }
}
