package org.eupathdb.common.model.contact;

import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.Map;

import javax.activation.DataHandler;

import org.gusdb.fgputil.web.RequestData;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.config.ModelConfig;
import org.gusdb.wdk.model.user.User;
import org.junit.Test;

public class ContactUsSubmitterTest {

  @Test
  public void testCreateAndSendEmail() throws WdkModelException {
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
    
    final User user = mock(User.class);
    final RequestData requestData = mock(RequestData.class);
    final WdkModel wdkModel = mock(WdkModel.class);
    final ModelConfig modelConfig = mock(ModelConfig.class);
    final Map<String, String> wdkModelProperties = new HashMap<String, String>();
    final EmailSender emailSender = mock(EmailSender.class);
        
    when(user.getUserId()).thenReturn(42l);
    
    when(requestData.getUserAgent()).thenReturn("Internet Explorer 5");
    when(requestData.getIpAddress()).thenReturn("127.0.0.1");
    when(requestData.getReferrer()).thenReturn("elmstreet.eupathdb.org/elmstreet.vm/contact.do");
    when(requestData.getAppHostName()).thenReturn("elmstreet.eupathdb.org");
    when(requestData.getAppHostAddress()).thenReturn("128.0.0.1");

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
        any()
    );
    
    verify(emailSender, times(1)).sendEmail(
        eq("serve.all.the.emails.net"),
        eq("johndoe@aol.com"),
        eq("support@dontcare.edu"),
        eq("My brain hurts!"),
        anyString(),
        eq("janedoe@hotmail.com, jimmydoe@gmail.com"),
        eq(new DataHandler[] {})
    );

    verify(emailSender, times(1)).sendEmail(
        eq("serve.all.the.emails.net"),
        eq("support@dontcare.edu"),
        eq("johndoe@aol.com"),
        eq("My brain hurts!"),
        anyString(),
        eq(null),
        eq(new DataHandler[] {})
    );

    verify(emailSender, times(1)).sendEmail(
        eq("serve.all.the.emails.net"),
        eq("dontcare@dontcare.edu"),
        eq("stilldontcare@dontcare.edu"),
        eq("My brain hurts!"),
        anyString(),
        eq(null),
        eq(new DataHandler[] {})
    );
  }
  
}
