package org.eupathdb.common.service.contact;

import static org.eupathdb.common.model.contact.ContactUsSubmitter.createAndSendEmail;
import static org.gusdb.fgputil.json.JsonUtil.getJsonArrayOrDefault;
import static org.gusdb.fgputil.json.JsonUtil.getStringOrDefault;
import static org.gusdb.fgputil.json.JsonUtil.toStringArray;

import java.util.Optional;
import java.util.stream.Stream;

import javax.activation.DataHandler;
import javax.activation.FileDataSource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.Consumes;
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
import org.gusdb.wdk.model.Attachment;
import org.gusdb.wdk.model.Utilities;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.model.user.User;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.gusdb.wdk.service.service.TemporaryFileService;
import org.gusdb.wdk.service.service.TemporaryFileService.TemporaryFileMetadata;
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
      @Context HttpServletRequest request) throws WdkModelException {
    LOG.info("Handling 'contact us' request...");

    try {
      User user = getSessionUser();
      RequestData requestData = new HttpRequestData(request);
      WdkModel wdkModel = getWdkModel();
      HttpSession session = getSession();
            
      JSONObject jsonBody = new JSONObject(body);
      ContactUsParams contactUsParams = parseContactParams(jsonBody, wdkModel, session);
      
      createAndSendEmail(
        contactUsParams,
        user,     
        requestData,
        wdkModel,
        Utilities::sendEmail
      );  
    }
    catch(WdkRuntimeException ex) {
      throw new WdkModelException(ex);
    }
    
    return Response.ok().build();
  }
  
  public static ContactUsParams parseContactParams(JSONObject jsonBody, WdkModel wdkModel, HttpSession session) {
    String message = jsonBody.getString("message");
    
    String subject = getStringOrDefault(jsonBody, "subject", "");
    String reporterEmail = getStringOrDefault(jsonBody, "reporterEmail", "");
    
    JSONArray ccEmailsJson = getJsonArrayOrDefault(
      jsonBody, 
      "ccEmails", 
      new JSONArray()
    );
    String[] ccEmails = toStringArray(ccEmailsJson);
        
    JSONArray attachmentIdsJson = getJsonArrayOrDefault(
      jsonBody, 
      "attachmentIds", 
      new JSONArray()
    );
    String[] attachmentIds = toStringArray(attachmentIdsJson);
    Attachment[] attachments = fetchAttachments(attachmentIds, wdkModel, session);
    
    return new ContactUsParams(
      subject,
      reporterEmail,
      ccEmails,
      message,
      attachments
    );
  }
  
  private static Attachment[] fetchAttachments(String[] attachmentIds, WdkModel wdkModel, HttpSession session) {
    return Stream
      .of(attachmentIds)
      .map(attachmentId -> fetchAttachment(attachmentId, wdkModel, session))
      .toArray(Attachment[]::new);
  }

  private static Attachment fetchAttachment(String attachmentId, WdkModel wdkModel, HttpSession session) {
    java.nio.file.Path attachmentPath = getAttachmentPath(attachmentId, wdkModel, session)
      .orElseThrow(() -> new WdkRuntimeException("Could not find expected attachment " + attachmentId));
    DataHandler tempFileDataHandler = new DataHandler(new FileDataSource(attachmentPath.toFile()));

    TemporaryFileMetadata attachmentMetadata = TemporaryFileService.getTempFileMetadata(attachmentId, session)
      .orElseThrow(() -> new WdkRuntimeException("Could not find expected metadata for attachment " + attachmentId));

    return new Attachment(tempFileDataHandler, attachmentMetadata.getOriginalName());
  }

  private static Optional<java.nio.file.Path> getAttachmentPath(String tempFile, WdkModel wdkModel, HttpSession session) {
    return TemporaryFileService.getTempFileFactory(wdkModel, session).apply(tempFile);
  }
  
}
