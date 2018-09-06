package org.eupathdb.common.service.contact;

import static org.eupathdb.common.model.contact.ContactUsSubmitter.createAndSendEmail;
import static org.gusdb.fgputil.json.JsonUtil.getJsonArrayOrDefault;
import static org.gusdb.fgputil.json.JsonUtil.getStringOrDefault;
import static org.gusdb.fgputil.json.JsonUtil.toStringArray;

import javax.activation.DataHandler;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.InternalServerErrorException;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.eupathdb.common.model.contact.ContactUsParams;
import org.gusdb.fgputil.web.HttpRequestData;
import org.gusdb.fgputil.web.RequestData;
import org.gusdb.wdk.model.Utilities;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.user.User;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONArray;
import org.json.JSONObject;

@Path("/contact-us")
public class ContactUsService extends AbstractWdkService {
  
  private static final Logger LOG = Logger.getLogger(ContactUsService.class);
  
  // TODO: Validate using this schema
  //  {
  //    "$schema": "http://json-schema.org/draft-07/schema",
  //    "type": ["object"],
  //    "properties": {
  //      "message": {
  //        "type": "string"
  //      },
  //      "subject": {
  //        "type": "string"
  //      },
  //      "reporterEmail": {
  //        "type": "string",
  //        "oneOf": [
  //           {
  //             "format": "email"
  //           },
  //           {
  //             "maxLength": 0
  //           }
  //         ]
  //      },
  //      "ccEmails": {
  //        "type": "array",
  //        "items": {
  //          "type": "string",
  //          "format": "email"
  //        },
  //        "maxItems": 10
  //      },
  //      "attachmentIds": {
  //        "type": "array",
  //        "items": {
  //          "type": "integer"
  //        },
  //        "maxItems": 3
  //      }
  //    },
  //    "required": ["message"]
  //  }
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.TEXT_PLAIN)
  public Response buildResult(
      String body, 
      @Context HttpServletRequest request) {
    LOG.info("Handling 'contact us' request...");
        
    try {
      final User user = this.getSessionUser();
      final RequestData requestData = new HttpRequestData(request);
      final WdkModel wdkModel = this.getWdkModel();
      final String displayName = wdkModel.getDisplayName();
            
      final JSONObject jsonBody = new JSONObject(body);
      final ContactUsParams contactUsParams = parseContactParams(jsonBody);
      
      createAndSendEmail(
          contactUsParams,
          user,     
          requestData,
          wdkModel,
          Utilities::sendEmail
      );  
      
      return Response.ok(
          "Your message has been sent to the " + displayName + " team.\n" +
          "For your records, a copy has been sent to your email." 
      ).build();
    } 
    catch (Exception ex) {
      LOG.error("Error while emailing 'contact us' message", ex);
      throw new InternalServerErrorException("There was an error, and your message may not have been sent.\nPlease try resubmitting.");      
    }
  }
  
  public static ContactUsParams parseContactParams(JSONObject jsonBody) {
    final String message = jsonBody.getString("message");
    
    final String subject = getStringOrDefault(jsonBody, "subject", "");
    final String reporterEmail = getStringOrDefault(jsonBody, "reporterEmail", "");
    
    final JSONArray ccEmailsJson = getJsonArrayOrDefault(
        jsonBody, 
        "ccEmails", 
        new JSONArray()
    );
    final String[] ccEmails = toStringArray(ccEmailsJson);
        
    final JSONArray attachmentIdsJson = getJsonArrayOrDefault(
        jsonBody, 
        "ccEmails", 
        new JSONArray()
    );
    final String[] attachmentIds = toStringArray(attachmentIdsJson);
    final DataHandler[] attachments = fetchAttachments(attachmentIds);
    
    return new ContactUsParams(
        subject,
        reporterEmail,
        ccEmails,
        message,
        attachments
    );
  }
  
  private static DataHandler[] fetchAttachments(String[] attachmentIds) {
    return new DataHandler[] {};
  }
  
}