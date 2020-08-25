package org.eupathdb.common.service.brc;

import java.io.IOException;
import java.util.Set;

import org.gusdb.wdk.core.api.JsonKeys;
import org.gusdb.wdk.service.request.exception.RequestMisformatException;
import org.gusdb.wdk.service.request.user.DatasetRequestProcessor.DatasetSourceType;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Holds the BRC request information for experiment searches by gene list
 * 
 * @author crisl-adm
 */
public class BrcRequest {

  public static final String DATASET_QUESTION_NAME = "DatasetQuestions.DatasetsByGeneList";

  private String type;
  private String idSource;
  private Set<String> ids;
  private String thresholdType;
  private double threshold;
  private boolean useOrthology;

  private String datasetCutoffType;
  private double datasetCutoff;

  private String datasetSelection;

  private Long datasetId;

  /**
   * Salts the JSON object provided by the BRC search request into members for later use in
   * assembling the request to the WDK answer service.
   * @param json
   * @return
   * @throws RequestMisformatException
   */
  public static BrcRequest createFromJson(JSONObject json) throws RequestMisformatException {
    try {
      BrcRequest request = new BrcRequest();
      request.type = json.getString("type");
      request.idSource = json.getString("idSource");
      String idSet = json.getJSONArray("ids").toString();
      ObjectMapper mapper = new ObjectMapper();
      TypeReference<Set<String>> setType = new TypeReference<Set<String>>() {};
      request.ids = mapper.readValue(idSet, setType);
      request.datasetSelection = json.getString("datasetSelection");
      request.thresholdType = json.getString("thresholdType");
      request.threshold = json.getDouble("threshold");

      request.useOrthology = json.getJSONObject("additionalFlags").getBoolean("useOrthology");

      request.datasetCutoff = json.getJSONObject("additionalFlags").getDouble("datasetCutoff");
      request.datasetCutoffType = json.getJSONObject("additionalFlags").getString("datasetCutoffType");


      return request;
    }
    catch (IOException | JSONException e) {
      throw new RequestMisformatException("Unable to parse BRC request", e);
    }
  }

  /**
   * Converts the gene list data from the BRC request into a JSON object that serves as
   * a WDK dataset param request
   * @return - JSON object to send to WDK dataset param request
   */
  public JSONObject getDatasetJson() {
    DatasetSourceType sourceType = DatasetSourceType.ID_LIST;
    return new JSONObject()
        .put(JsonKeys.SOURCE_TYPE, sourceType.getJsonKey())
        .put(JsonKeys.SOURCE_CONTENT, new JSONObject().put(sourceType.getConfigJsonKey(), ids));
  }

  /**
   * Converts the search data from the BRC request and the dataset param request
   * into a JSON object that serves as a WDK answer request
   * @return - JSON object to send to WDK answer request
   */
  public JSONObject getAnswerJson() {
    return new JSONObject()
      .put(JsonKeys.SEARCH_CONFIG, getAnswerSpecJson())
      .put(JsonKeys.REPORT_CONFIG, getFormatting());
  }

  /**
   * Convenience method breaking out the answer spec portion of the
   * answer JSON
   * @return
   */
  public JSONObject getAnswerSpecJson() {
    return new JSONObject()
        .put(JsonKeys.PARAMETERS, getParametersJson())
        .put(JsonKeys.WDK_WEIGHT, 10);
  }

  /**
   * Convenience method breaking out the formatting portion of the
   * answer JSON
   * @return
   */
  public JSONObject getFormatting() {
    return new JSONObject()
        .put(JsonKeys.ATTRIBUTES, new JSONArray()
          .put("display_name")
          .put("summary")
          .put("organism_prefix")
             //          .put("hit_count")
             //          .put("percent_count")
          .put("obser_ovelap")
          .put("exp_overlap")
	  .put("fold_enrichment")
          .put("percent_ul")
          .put("percent_ds")
          .put("p_value")
          .put("newcategory"));
  }

  /**
   * Convenience method breaking out the parameters portion of the 
   * answer JSON
   * @return
   */
  public JSONObject getParametersJson() {
    return new JSONObject()  
        .put("orthologyFlag", useOrthology ? "yes" : "no")
        .put("ds_gene_ids", String.valueOf(datasetId))
        .put("threshold", String.valueOf(threshold))
        .put("datasetCutoff", String.valueOf(datasetCutoff))
        .put("datasetCutoffType", String.valueOf(datasetCutoffType))
        .put("datasetSelection", String.valueOf(datasetSelection));
  }

  public String getType() {
    return type;
  }

  public String getIdSource() {
    return idSource;
  }

  public Set<String> getIds() {
    return ids;
  }

  public String getThresholdType() {
    return thresholdType;
  }

  public double getThreshold() {
    return threshold;
  }


  public String getDatasetCutoffType() {
    return datasetCutoffType;
  }

  public double getDatasetCutoff() {
    return datasetCutoff;
  }

  public String getDatasetSelection() {
    return datasetSelection;
  }


  public Long getDatasetId() {
    return datasetId;
  }

  public void setDatasetId(long datasetId) {
    this.datasetId = datasetId;
  }

}
