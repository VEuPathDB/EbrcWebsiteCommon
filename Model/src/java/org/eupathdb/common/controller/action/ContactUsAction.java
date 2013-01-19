package org.eupathdb.common.controller.action;

import java.util.ArrayList;
import java.util.Map;
import javax.activation.DataHandler;
import javax.mail.util.ByteArrayDataSource;

import org.apache.commons.fileupload.disk.DiskFileItem;
import org.apache.log4j.Logger;
import org.gusdb.wdk.controller.actionutil.ActionResult;
import org.gusdb.wdk.controller.actionutil.ParamDef;
import org.gusdb.wdk.controller.actionutil.ParamDef.DataType;
import org.gusdb.wdk.controller.actionutil.ParamDef.Required;
import org.gusdb.wdk.controller.actionutil.ParamDefMapBuilder;
import org.gusdb.wdk.controller.actionutil.ParamGroup;
import org.gusdb.wdk.controller.actionutil.ResponseType;
import org.gusdb.wdk.controller.actionutil.WdkAction;
import org.gusdb.wdk.model.Utilities;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.jspwrap.UserBean;
import org.gusdb.wdk.model.jspwrap.WdkModelBean;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Sends a support email to the support email address configured in
 * model-config.xml (see org.gusdb.wdk.model.ModelConfig.getSupportEmail())
 *
 * @author dfalke
 */
public class ContactUsAction extends WdkAction {

  private static final Logger logger = Logger.getLogger(ContactUsAction.class.getName());
  
  private static final String SUCCESS_AJAX_RESPONSE = "success";
  private static final String ERROR_AJAX_RESPONSE = "error";
  
  /** the reply-to address */
	private static final String PARAM_REPLY = "reply";
	
	/** the email subject */
	private static final String PARAM_SUBJECT = "subject";

	/** the email content */
	private static final String PARAM_CONTENT = "content";

	/** CC addresses */
	private static final String PARAM_ADDCC = "addCc";

	/** Attachments */
	private static final String PARAM_ATTACHMENT_PREFIX = "attachment";
	private static final int PARAM_ATTACHMENT_COUNT = 3;
	private static final int PARAM_ATTACHMENT_MAX_SIZE_MB = 5;


  private static final Map<String, ParamDef> PARAM_DEFS = new ParamDefMapBuilder()
    .addParam(PARAM_REPLY, new ParamDef(Required.REQUIRED))
    .addParam(PARAM_SUBJECT, new ParamDef(Required.REQUIRED))
    .addParam(PARAM_CONTENT, new ParamDef(Required.REQUIRED))
    .addParam(PARAM_ADDCC, new ParamDef(Required.OPTIONAL)).toMap();

  static {
    for (int i = 1; i <= PARAM_ATTACHMENT_COUNT; i++) {
      PARAM_DEFS.put(PARAM_ATTACHMENT_PREFIX + Integer.toString(i),
          new ParamDef(Required.OPTIONAL, DataType.FILE));
    }
  }

  @Override
  protected boolean shouldValidateParams() {
    return true;
  }
	
	@Override
	protected Map<String, ParamDef> getParamDefs() {
	  return PARAM_DEFS;
	}

  @Override
  protected int getMaxUploadSize() {
    return PARAM_ATTACHMENT_MAX_SIZE_MB;
  }
  
	  
	@Override
	protected ActionResult handleRequest(ParamGroup params) throws Exception {
	  logger.debug("Entering ContactUs...");
	  
	  UserBean user = getCurrentUser();
	  WdkModelBean wdkModelBean = getWdkModel();
	  WdkModel wdkModel = wdkModelBean.getModel();
	  
	  String reply = params.getValueOrEmpty(PARAM_REPLY);
	  String subject = params.getValueOrEmpty(PARAM_SUBJECT);
	  String content = params.getValueOrEmpty(PARAM_CONTENT);
    String addCc = params.getValueOrEmpty(PARAM_ADDCC);

    ArrayList<DataHandler> attachmentList = new ArrayList<DataHandler>();
    for (int i = 1; i <= PARAM_ATTACHMENT_COUNT; i++) {
      DiskFileItem attachment = params.getUpload(PARAM_ATTACHMENT_PREFIX
          + Integer.toString(i));
      if (attachment != null && attachment.getSize() > 0L) {
        ByteArrayDataSource ads = new ByteArrayDataSource(attachment.get(),
            attachment.getContentType());
        ads.setName(attachment.getName());
        DataHandler adh = new DataHandler(ads);
        attachmentList.add(adh);
      }
    }
    DataHandler[] attachments = attachmentList.toArray(new DataHandler[0]);

    
	  String supportEmail = wdkModel.getModelConfig().getSupportEmail();
	  String uid = Integer.toString(user.getUserId());
	  String version = wdkModelBean.getVersion();
	  String website = wdkModelBean.getDisplayName();
	  // TODO: need to move these to a WDK config file
	  String reporterEmail = "websitesupportform@apidb.org";
	  String redmineEmail = "redmine@apidb.org";
	  
	  if (reply.isEmpty()) {
	    reply = supportEmail;
	  }
	  
	  if (!addCc.isEmpty() && addCc.split(",\\s*(?=\\w)").length > 10) {
	    // only 10 addresses allowed
	    return getJsonResult(ERROR_AJAX_RESPONSE, "No more than 10 Cc addresses" +
	    		"are allowed. Please reduce your list to 10 email addresses.");
	  }
	  
	  RequestData reqData = getRequestData();
	  
	  String metaInfo = "ReplyTo: " + reply + "\n" +
	      "CC: " + addCc + "\n" +
	      "Privacy preferences: " + "\n" +
	      "Uid: " + uid + "\n" +
	      "Browser information: " + reqData.getBrowser() + "\n" +
	      "Referrer page: " + reqData.getReferrer() + "\n" +
	      "WDK Model version: " + version;
	  
	  String autoContent = "****THIS IS NOT A REPLY**** \nThis is an automatic" +
	      " response, that includes your message for your records, to let you" +
	      " know that we have received your email and will get back to you as" +
	      " soon as possible. Thanks so much for contacting us!\n\nThis was" +
	      " your message:\n\n---------------------\n" + content +
	      "\n---------------------\n\n";
	  
	  String redmineMetaInfo = "Project: usersupportrequests\n" +
	      "Category: " + website + "\n" +
	      "\n" + metaInfo + "\n" +
	      "Client IP Address: " + reqData.getIpAddress() + "\n";
	  
	  try {
	    // send auto-reply
      Utilities.sendEmail(wdkModel, reply, supportEmail, subject,
          escapeHtml(metaInfo + "\n\n" + autoContent), addCc, attachments);

      // send support email
      Utilities.sendEmail(wdkModel, supportEmail, reply, subject,
          escapeHtml(metaInfo + "\n\n" + content), null, attachments);

      // send redmine email
      Utilities.sendEmail(wdkModel, redmineEmail, reporterEmail, subject,
          escapeHtml(redmineMetaInfo + "\n\n" + content), null, attachments);

      // not using Ajax at the moment due to file uploads
    	// return getJsonResult(SUCCESS_AJAX_RESPONSE,
    	//     "We appreciate your feedback. Your message was sent successfully.");    	
      return new ActionResult().setViewName(SUCCESS);
	  }
	  catch (Exception ex) {
	    logger.error("Failure while processing 'contact us' request", ex);
	    return getJsonResult(ERROR_AJAX_RESPONSE,
	        "There was an error and your message may not have been sent.");
	  }
  }
  
  private ActionResult getJsonResult(String status, String message) throws JSONException {
    JSONObject jsMessage = new JSONObject();
    jsMessage.put("status", status);
    jsMessage.put("message", message);
    return new ActionResult(ResponseType.json)
        .setRequestAttribute("jsonData", jsMessage.toString())
        .setViewName(SUCCESS);
  }
}
