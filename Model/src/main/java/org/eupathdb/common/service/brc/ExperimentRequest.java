package org.eupathdb.common.service.brc;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Holds the BRC request information for experiments
 * @author crisl-adm
 *
 */
public class ExperimentRequest {
  private String experimentId;
  private String orthologs;
  
  /**
   * Converts the data from the BRC request into a JSON object that serves as
   * a WDK dataset record request
   * @return - JSON object to send to WDK dataset record request
   */
  public JSONObject getDatasetRecordJson() {
    return new JSONObject()
      .put("primaryKey", new JSONArray()
        .put(new JSONObject()
          .put("name", "dataset_id")
          .put("value", experimentId)))
      .put("attributes", new JSONArray()
        .put("display_name")
        .put("summary")
        .put("organism_prefix")
        .put("newcategory"))
      .put("tables", new JSONArray()
        .put("DatasetGeneTable")
        .put("GenomeHistory")
        .put("HyperLinks"));
  }

  public String getExperimentId() {
	return experimentId;
  }

  public void setExperimentId(String experimentId) {
	this.experimentId = experimentId;
  }

  public String getOrthologs() {
	return orthologs;
  }

  public void setOrthologs(String orthologs) {
	this.orthologs = orthologs;
  }

}
