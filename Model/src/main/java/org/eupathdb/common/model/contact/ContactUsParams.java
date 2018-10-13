package org.eupathdb.common.model.contact;

import org.gusdb.wdk.model.Attachment;

// TODO: Should we factor out this "concretion"
// using an interface?
public class ContactUsParams {
  public final String subject;
  public final String reporterEmail;
  public final String[] ccEmails;
  public final String message;
  public final Attachment[] attachments;
  
  public ContactUsParams(
      String subject,
      String reporterEmail,
      String[] ccEmails,
      String message,
      Attachment[] attachments) {
    this.subject = subject;
    this.reporterEmail = reporterEmail;
    this.ccEmails = ccEmails;
    this.message = message;
    this.attachments = attachments;
  }
}
