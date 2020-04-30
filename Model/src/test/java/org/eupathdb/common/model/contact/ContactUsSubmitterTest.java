package org.eupathdb.common.model.contact;

import org.gusdb.fgputil.web.RequestData;
import org.gusdb.wdk.model.Attachment;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.config.ModelConfig;
import org.gusdb.wdk.model.user.User;
import org.junit.jupiter.api.Test;

import java.util.HashMap;

import static org.mockito.Mockito.*;

public class ContactUsSubmitterTest {

  @Test
  public void testCreateAndSendEmail() throws WdkModelException {
    var subject = "My brain hurts!";
    var reporterEmail = "johndoe@aol.com";
    var referrer = "http://brokenpage.com";
    var ccEmails = new String[] { "janedoe@hotmail.com", "jimmydoe@gmail.com" };
    var message = "If you could make my brain stop hurting, that'd be greeeeat.";
    var attachments = new Attachment[] {};
    var params = new ContactUsParams(
        subject,
        reporterEmail,
        referrer,
        ccEmails,
        message,
        attachments
    );

    var user = mock(User.class);
    var requestData = mock(RequestData.class);
    var wdkModel = mock(WdkModel.class);
    var modelConfig = mock(ModelConfig.class);
    var wdkModelProperties = new HashMap<String, String>();
    EmailSender emailSender = mock(EmailSender.class);

    when(user.getUserId()).thenReturn(42L);

    when(requestData.getUserAgent()).thenReturn("Internet Explorer 5");
    when(requestData.getLocalIpAddress()).thenReturn("127.0.0.1");
    when(requestData.getReferrer()).thenReturn("elmstreet.eupathdb.org/elmstreet.vm/app/contact-us");
    when(requestData.getLocalHost()).thenReturn("elmstreet.eupathdb.org");
    when(requestData.getLocalIpAddress()).thenReturn("128.0.0.1");

    when(wdkModel.getBuildNumber()).thenReturn("39");
    when(wdkModel.getDisplayName()).thenReturn("PlasmoDB");
    when(wdkModel.getModelConfig()).thenReturn(modelConfig);
    when(wdkModel.getProperties()).thenReturn(wdkModelProperties);

    when(modelConfig.getSupportEmail()).thenReturn("support@dontcare.edu");
    when(modelConfig.getSmtpServer()).thenReturn("serve.all.the.emails.net");

    wdkModelProperties.put("REDMINE_TO_EMAIL", "dontcare@dontcare.edu");
    wdkModelProperties.put("REDMINE_FROM_EMAIL", "stilldontcare@dontcare.edu");

    ContactUsSubmitter.createAndSendEmail(params, user, requestData, wdkModel, emailSender);

    verify(emailSender, times(3)).sendEmail(
        any(),
        any(),
        any(),
        any(),
        any(),
        any(),
        any(),
        any()
    );

    verify(emailSender, times(1)).sendEmail(
        eq("serve.all.the.emails.net"),
        eq("johndoe@aol.com"),
        eq("support@dontcare.edu"),
        eq("My brain hurts!"),
        anyString(),
        eq("janedoe@hotmail.com, jimmydoe@gmail.com"),
        eq(null),
        eq(new Attachment[] {})
    );

    verify(emailSender, times(1)).sendEmail(
        eq("serve.all.the.emails.net"),
        eq("support@dontcare.edu"),
        eq("johndoe@aol.com"),
        eq("My brain hurts!"),
        anyString(),
        eq(null),
        eq(null),
        eq(new Attachment[] {})
    );

    verify(emailSender, times(1)).sendEmail(
        eq("serve.all.the.emails.net"),
        eq("dontcare@dontcare.edu"),
        eq("stilldontcare@dontcare.edu"),
        eq("My brain hurts!"),
        anyString(),
        eq(null),
        eq(null),
        eq(new Attachment[] {})
    );
  }

}
