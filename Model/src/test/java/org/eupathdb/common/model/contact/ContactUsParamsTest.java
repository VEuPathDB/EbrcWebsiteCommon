package org.eupathdb.common.model.contact;

import static org.junit.Assert.*;

import javax.activation.DataHandler;

import org.junit.Test;

public class ContactUsParamsTest {

  @Test
  public void testConstructor() {
    final String subject = "My brain hurts!";
    final String reporterEmail = "johndoe@aol.com";
    final String[] ccEmails = new String[] { "janedoe@hotmail.com", "jimmydoe@gmail.com" };
    final String message = "If you could make my brain stop hurting, that'd be greeeeat.";
    final DataHandler[] attachments = new DataHandler[] {};
    
    final ContactUsParams params = new ContactUsParams(
        subject,
        reporterEmail,
        ccEmails,
        message,
        attachments
    );
    
    assertSame(subject, params.subject);
    assertSame(reporterEmail, params.reporterEmail);
    assertSame(ccEmails, params.ccEmails);
    assertSame(message, params.message);
    assertSame(attachments, params.attachments);
  }

}
