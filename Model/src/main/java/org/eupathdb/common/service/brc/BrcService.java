package org.eupathdb.common.service.brc;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.Set;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.IoUtil;
import org.gusdb.wdk.core.api.JsonKeys;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.question.Question;
import org.gusdb.wdk.model.report.reporter.DefaultJsonReporter;
import org.gusdb.wdk.service.request.exception.RequestMisformatException;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONObject;

/**
 * Provides service in conformance with the BRC Use Case 4 specification as of Apr 2017.
 * 
 * @author crisl-adm
 */
@Path("/hpi")
public class BrcService extends AbstractWdkService {

  private static Logger LOG = Logger.getLogger(BrcService.class);
  private NewCookie authCookie;
  private NewCookie sessionCookie;
  private final String EXPERIMENT_ID_PATH_PARAM = "experimentId";
  private final String ID_LIST_ID_PATH_PARAM = "idListId";
  private final String INCLUDE_ORTHOLOGS_QUERY_PARAM = "includeOrthologs";

  /**
   * Utility method to return the initial portion of the request uri so we can make internal REST calls using
   * that same base uri. The scheme is assumed to be http.
   * 
   * @return - uri string up to app name and service path
   */
  protected String getBaseUri() {
    return getUriInfo().getBaseUri().toString();
  }

  /**
   * REST service version of the DatasetQuestions.DatasetsByGeneList question
   * 
   * @param body
   * @return
   */
  @POST
  @Path("/search/experiment/gene-list")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response getBrc(String body) {
    JSONObject requestJson = new JSONObject(body);

    try {
      BrcRequest brcRequest = BrcRequest.createFromJson(requestJson);
      String userId = callUserService();
      callDatasetService(userId, brcRequest);
      LOG.info("JSON to AnswerService: " + brcRequest.getAnswerJson().toString(2));
      JSONObject answerJson = callAnswerService(brcRequest.getAnswerJson());
      LOG.info("Answer Service to JSON: " + answerJson.toString(2));
      Set<BrcBean> brcBeans = BrcBean.parseAnswerJson(answerJson, getBaseUri());
      return Response.ok(BrcFormatter.getJson(brcBeans).toString()).build();
    }
    catch (WdkModelException | RequestMisformatException e) {
      throw new BadRequestException(e);
    }
  }

  /**
   * Gets a set of experiment (WDK term is dataset) attributes for the experiment (a.k.a. dataset) as given
   * by its WDK based id.
   * 
   * @param experimentId
   * @return
   */
  @GET
  @Path("/experiment/{experimentId}")
  @Produces(MediaType.APPLICATION_JSON)
  public Response getExperiment(@PathParam(EXPERIMENT_ID_PATH_PARAM) String experimentId) {
    try {
      ExperimentRequest experimentRequest = new ExperimentRequest();
      experimentRequest.setExperimentId(experimentId);
      LOG.info("JSON to DatasetRecordService: " + experimentRequest.getDatasetRecordJson().toString(2));
      JSONObject datasetRecordJson = callDatasetRecordService(experimentRequest.getDatasetRecordJson());
      LOG.info("Dataset Record Service to JSON: " + datasetRecordJson.toString(2));
      BrcBean brcBean = BrcBean.parseRecordJson(datasetRecordJson, getBaseUri(), false);
      return Response.ok(BrcFormatter.getBrcJson(brcBean, false).toString()).build();
    }
    catch (WdkModelException e) {
      throw new BadRequestException(e);
    }
  }

  /**
   * Gets only the gene list attributes associated with a given experiment (a.k.a. dataset). Note that, for
   * now, since there is only one gene list per dataset and since the gene list has no identifier, the same
   * identifier is applied for both the gene list and the dataset.
   * 
   * @param experimentId
   * @param idListId
   * @return
   */
  @GET
  @Path("/experiment/{experimentId}/gene-list/{idListId}")
  @Produces(MediaType.APPLICATION_JSON)
  public Response getIdList(@PathParam(EXPERIMENT_ID_PATH_PARAM) String experimentId,
      @PathParam(ID_LIST_ID_PATH_PARAM) String idListId) {
    try {
      ExperimentRequest experimentRequest = new ExperimentRequest();
      experimentRequest.setExperimentId(experimentId);
      JSONObject datasetRecordJson = callDatasetRecordService(experimentRequest.getDatasetRecordJson());
      BrcGeneListBean brcGeneListBean = BrcBean.parseRecordJson(datasetRecordJson, getBaseUri(), false).getIdLists();
      return Response.ok(BrcFormatter.getGeneListJson(brcGeneListBean, false).toString()).build();
    }
    catch (WdkModelException e) {
      throw new BadRequestException(e);
    }
  }

  /**
   * Provides a list of gene ids for the given experiment and id list.
   * 
   * @param experimentId
   * @param idListId
   * @return
   */
  @GET
  @Path("/experiment/{experimentId}/gene-list/{idListId}/ids")
  @Produces(MediaType.APPLICATION_JSON)
  public Response getIds(@PathParam(EXPERIMENT_ID_PATH_PARAM) String experimentId,
      @PathParam(ID_LIST_ID_PATH_PARAM) String idListId,
      @QueryParam(INCLUDE_ORTHOLOGS_QUERY_PARAM) String includeOrthologs) {
    try {
      ExperimentRequest experimentRequest = new ExperimentRequest();
      experimentRequest.setExperimentId(experimentId);
      experimentRequest.setOrthologs(includeOrthologs);
      LOG.info("JSON to DatasetRecordService: " + experimentRequest.getDatasetRecordJson().toString(2));
      JSONObject datasetRecordJson = callDatasetRecordService(experimentRequest.getDatasetRecordJson());
      LOG.info("Dataset Record Service to JSON: " + datasetRecordJson.toString(2));
      BrcGeneListBean brcGeneListBean = BrcBean.parseRecordJson(datasetRecordJson, getBaseUri(), false).getIdLists();
      return Response.ok(BrcFormatter.getGeneListIdsJson(brcGeneListBean).toString()).build();
    }
    catch (WdkModelException e) {
      throw new BadRequestException(e);
    }
  }

  /**
   * Provides an API for the gene list search detailing the input types
   * 
   * @return
   */
  @GET
  @Path("/search/experiment/gene-list/api")
  @Produces(MediaType.APPLICATION_JSON)
  public Response getApi() {
    return Response.ok(ApiFormatter.getJson().toString()).build();
  }

  /**
   * Calls the WDK answer service to obtain the results of the gene list search.
   * 
   * @param brcRequest
   * @return
   * @throws WdkModelException
   */
  protected JSONObject callAnswerService(JSONObject answerJson) throws WdkModelException {
    Question question = getWdkModel().getQuestionByName(BrcRequest.DATASET_QUESTION_NAME)
        .orElseThrow(() -> new WdkModelException(BrcRequest.DATASET_QUESTION_NAME + " is no longer part of the WDK model."));
    Client client = ClientBuilder.newBuilder().build();
    Response response = client
        .target(getBaseUri() +
            "record-classes/" +
            question.getRecordClass().getUrlSegment() +
            "/searches/" +
            question.getUrlSegment() +
            "/reports/" +
            DefaultJsonReporter.RESERVED_NAME)
        .property("Content-Type", MediaType.APPLICATION_JSON)
        .request(MediaType.APPLICATION_JSON)
        .cookie(authCookie)
        .cookie(sessionCookie)
        .post(Entity.entity(answerJson.toString(), MediaType.APPLICATION_JSON));
    try {
      if (response.getStatus() == 200) {
        InputStream resultStream = (InputStream) response.getEntity();
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        IoUtil.transferStream(buffer, resultStream);
        return new JSONObject(new String(buffer.toByteArray()));
      }
      else {
        throw new WdkModelException("Bad status - " + response.getStatus());
      }
    }
    catch (IOException ioe) {
      throw new WdkModelException(ioe);
    }
    finally {
      response.close();
      client.close();
    }
  }

  /**
   * Obtains the id of the user making this request. The authentication and session cookies are save in
   * anticipation of use in additional follow-up REST service calls.
   * 
   * @return
   * @throws WdkModelException
   */
  protected String callUserService() throws WdkModelException {
    Client client = ClientBuilder.newBuilder().build();
    Response response = client
        .target(getBaseUri() + "users/current")
        .request(MediaType.APPLICATION_JSON)
        .get();
    try {
      if (response.getStatus() == 200) {
        Map<String, NewCookie> cookies = response.getCookies();
        authCookie = cookies.get("wdk_check_auth");
        sessionCookie = cookies.get("JSESSIONID");
        InputStream resultStream = (InputStream) response.getEntity();
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        IoUtil.transferStream(buffer, resultStream);
        JSONObject json = new JSONObject(new String(buffer.toByteArray()));
        return String.valueOf(json.getInt("id"));
      }
      else {
        throw new WdkModelException("Bad status - " + response.getStatus());
      }
    }
    catch (IOException ioe) {
      throw new WdkModelException(ioe);
    }
    finally {
      response.close();
      client.close();
    }
  }

  /**
   * Applies the user's id and the set of gene ids from the BRC request to object a dataset parameter id. Note
   * that the auth and session cookies are set previously by the call to retrieve the user id.
   * 
   * @param userId
   * @param brcRequest
   * @throws WdkModelException
   */
  protected void callDatasetService(String userId, BrcRequest brcRequest) throws WdkModelException {
    Client client = ClientBuilder.newBuilder().build();
    Response response = client
        .target(getBaseUri() + "users/" + userId + "/datasets")
        .property("Content-Type", MediaType.APPLICATION_JSON)
        .request(MediaType.APPLICATION_JSON)
        .cookie(authCookie)
        .cookie(sessionCookie)
        .post(Entity.entity(brcRequest.getDatasetJson().toString(), MediaType.APPLICATION_JSON));
    try {
      if (response.getStatus() == 200) {
        InputStream resultStream = (InputStream) response.getEntity();
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        IoUtil.transferStream(buffer, resultStream);
        JSONObject json = new JSONObject(new String(buffer.toByteArray()));
        brcRequest.setDatasetId(json.getLong(JsonKeys.ID));
      }
      else {
        throw new WdkModelException("Bad status - " + response.getStatus());
      }
    }
    catch (IOException ioe) {
      throw new WdkModelException(ioe);
    }
    finally {
      response.close();
      client.close();
    }
  }

  /**
   * Gets the dataset based upon a dataset id.
   * 
   * @param experimentRequest
   * @return
   * @throws WdkModelException
   */
  protected JSONObject callDatasetRecordService(JSONObject datasetRecordJson) throws WdkModelException {
    Client client = ClientBuilder.newBuilder().build();
    Response response = client
        .target(getBaseUri() + "records/DatasetRecordClasses.DatasetRecordClass/instance")
        .property("Content-Type", MediaType.APPLICATION_JSON)
        .request(MediaType.APPLICATION_JSON)
        .post(Entity.entity(datasetRecordJson.toString(), MediaType.APPLICATION_JSON));
    try {
      if (response.getStatus() == 200) {
        InputStream resultStream = (InputStream) response.getEntity();
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        IoUtil.transferStream(buffer, resultStream);
        return new JSONObject(new String(buffer.toByteArray()));
      }
      else {
        throw new WdkModelException("Bad status - " + response.getStatus());
      }
    }
    catch (IOException ioe) {
      throw new WdkModelException(ioe);
    }
    finally {
      response.close();
      client.close();
    }
  }

}
