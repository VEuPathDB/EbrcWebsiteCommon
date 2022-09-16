package org.eupathdb.common.model.contact;

import static org.gusdb.fgputil.FormatUtil.escapeHtml;
import static org.gusdb.fgputil.FormatUtil.join;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.web.RequestData;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.config.ModelConfig;
import org.gusdb.wdk.model.user.User;

public class ContactUsSubmitter {  
  private static final Logger LOG = Logger.getLogger(ContactUsSubmitter.class);
  
  private ContactUsSubmitter() {}
  
  public static void createAndSendEmail(
      ContactUsParams params, 
      User user,
      RequestData requestData,
      WdkModel wdkModel,
      EmailSender emailSender) throws WdkModelException {
    ModelConfig modelConfig = wdkModel.getModelConfig();
        
    String supportEmail = modelConfig.getSupportEmail();
    String uid = Long.toString(user.getUserId());
    String version = wdkModel.getBuildNumber();
    String website = wdkModel.getDisplayName();
    
    String replyEmail = params.reporterEmail.isEmpty() 
        ? supportEmail 
        : params.reporterEmail;
    String ccField = join(params.ccEmails, ", ");
    
    String metaInfo =
        "ReplyTo: " + replyEmail + "\n" +
        "CC: " + ccField + "\n" +
        "Privacy preferences: " + "\n" +
        "Uid: " + uid + "\n" +
        "Browser information: " + requestData.getUserAgent() + "\n" +
        "Referrer page: " + params.referrer + "\n" +
        "WDK Model version: " + version;

    String emailContent = "****THIS IS NOT A REPLY**** \nThis is an automatic" +
        " response, that includes your message for your records, to let you" +
        " know that we have received your email and will get back to you as" +
        " soon as possible. Thanks so much for contacting us!\n\nThis was" +
        " your message:\n---------------------\n" + params.message + 
        "\n---------------------";

    String contextContent = "Context:\n---------------------\n" +
      (params.context == null ? "None" : params.context) + "\n" +
      "---------------------";

    // easyredmine needs these extra <br>
    String metaInfoForRedmine =
        "ReplyTo: " + replyEmail + "\n" +  "<br>" +
        "CC: " + ccField + "\n" + "<br>" +
        "Privacy preferences: " + "\n" + "<br>" +
        "Uid: " + uid + "\n" + "<br>" +
        "Browser information: " + requestData.getUserAgent() + "\n" + "<br>" +
        "Referrer page: " + params.referrer + "\n" + "<br>" +
        "WDK Model version: " + version;

    String redmineMetaInfo = "Project: usersupportrequests\n" + 
        "Tracker: Communication\n" +
        "Category: " + website + "\n" + "\n" + "<br>" +
        metaInfoForRedmine + "\n" + "<br>" +
        "Client IP Address: " + requestData.getRemoteIpAddress() + "\n" + "<br>" +
        "Request URL: " + requestData.getFullRequestUri() + "\n" + "<br>" +
        "WDK Host: " + requestData.getLocalHost() + "<br>" + " (" + requestData.getLocalIpAddress() + ")\n\n" + "<br>" +
        contextContent + "\n" + "<br>";
    
    String smtpServer = modelConfig.getSmtpServer();
    
    // Send auto-reply
    emailSender.sendEmail(
        smtpServer, 
        replyEmail, 
        supportEmail, 
        params.subject,
        escapeHtml(metaInfo + "\n\n" + contextContent + "\n\n" + emailContent + "\n\n"), 
        ccField,null, 
        params.attachments
    );

    // Send support email
    LOG.debug("\n\nSUBJECT: " + params.subject +  "\n -----TO: " + supportEmail + "\nMESSAGE: \n" + params.message + "\n\n");
     emailSender.sendEmail( 
        smtpServer, 
        supportEmail, 
        replyEmail, 
        params.subject,
        escapeHtml(metaInfo + "\n\n" + contextContent + "\n\n" + params.message + "\n\n"), 
        null, null,
        params.attachments
    ); 
       
    // Send Redmine email
    // easyredmine needs these extra <br>
    emailSender.sendEmail(
        smtpServer, 
        wdkModel.getProperties().get("REDMINE_TO_EMAIL"), 
        wdkModel.getProperties().get("REDMINE_FROM_EMAIL"), 
        params.subject,
        escapeHtml(redmineMetaInfo + "\n\n" + "<br>" + params.message.replace("\n","\n<br>") + "\n\n" + "<br>" ), 
        null, null,
        params.attachments
    );    
  }
  
}
