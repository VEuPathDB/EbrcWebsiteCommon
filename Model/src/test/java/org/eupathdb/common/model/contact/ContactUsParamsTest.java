package org.eupathdb.common.model.contact;

import static org.junit.Assert.*;

import org.gusdb.wdk.model.Attachment;
import org.junit.Test;

public class ContactUsParamsTest {

  @Test
  public void testConstructor() {
    String subject = "My brain hurts!";
    String reporterEmail = "johndoe@aol.com";
    String referrer = "http://brokenpage.com";
    String[] ccEmails = new String[] { "janedoe@hotmail.com", "jimmydoe@gmail.com" };
    String message = "If you could make my brain stop hurting, that'd be greeeeat.";
    String context = "foo context";
    Attachment[] attachments = new Attachment[] {};
    
    ContactUsParams params = new ContactUsParams(
      subject,
      reporterEmail,
      referrer,
      ccEmails,
      message,
      context,
      attachments
    );
    
    assertSame(subject, params.subject);
    assertSame(reporterEmail, params.reporterEmail);
    assertSame(ccEmails, params.ccEmails);
    assertSame(message, params.message);
    assertSame(attachments, params.attachments);
    assertSame(context, params.context);
  }

}
