package org.eupathdb.common.service.brc;

import java.util.HashSet;
import java.util.Set;

import org.gusdb.wdk.model.WdkModelException;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * A bean holding the information to be send back in response to a BRC request.
 * @author crisl-adm
 *
 */
public class BrcBean {
  private String experimentIdentifier;
  private String displayName;
  private String type;
  private String description;
  private String uri;
  private String species;
  private String genomeVersion;
  private BrcGeneListBean idLists;
  
  /**
   * Convert the WDK answer returned by a BRC search request into Brc bean objects so that
   * they may be converted back into a BRC response easily.
   * @param answerJson
   * @return
   * @throws WdkModelException
   */
  public static Set<BrcBean> parseAnswerJson(JSONObject answerJson, String baseUri) throws WdkModelException {
	Set<BrcBean> brcBeans = new HashSet<>();  
	JSONArray recordsJson = answerJson.getJSONArray("records");
	for(int i = 0; i < recordsJson.length(); i++) {
	  JSONObject recordJson = recordsJson.getJSONObject(i);
	  BrcBean brcBean = parseRecordJson(recordJson, baseUri, true);
	  brcBeans.add(brcBean);
	}
	return brcBeans;
  }
  
  /**
   * Convert a WDK record into a BRC bean object so that it may be converted back
   * into a BRC response easily.  Note that this method is reached via both a search
   * request and a record request.  Since some attributes are available only via a
   * search request, a flag is set to distinguish between the two entries.
   * @param recordJson
   * @param search - true if a search request, false otherwise.
   * @return
   * @throws WdkModelException
   */
  protected static BrcBean parseRecordJson(JSONObject recordJson, String baseServiceUri, boolean search) throws WdkModelException {
    BrcBean brcBean = new BrcBean();
    brcBean.setExperimentIdentifier(
      String.valueOf(((JSONObject)recordJson.getJSONArray("id").get(0)).get("value"))
    );
    JSONObject attributesJson = recordJson.getJSONObject("attributes");
    brcBean.setDisplayName(attributesJson.getString("display_name"));
    brcBean.setType(attributesJson.getString("newcategory"));
    brcBean.setDescription(attributesJson.getString("summary"));
    String baseApiUri = baseServiceUri.substring(0, baseServiceUri.indexOf("service/")) + "app/";
    brcBean.setUri(baseApiUri + "record/dataset/" + brcBean.getExperimentIdentifier());
    brcBean.setSpecies(attributesJson.getString("organism_prefix"));
    brcBean.setGenomeVersion("NA");
    brcBean.setIdLists(BrcGeneListBean.parseRecordGeneListJson(recordJson, search));
    return brcBean;
  }
  
  public String getExperimentIdentifier() {
	return experimentIdentifier;
  }
  
  public void setExperimentIdentifier(String experimentIdentifier) {
	this.experimentIdentifier = experimentIdentifier;
  }
  
  public String getDisplayName() {
	return displayName;
  }
  
  public void setDisplayName(String displayName) {
	this.displayName = displayName;
  }
  
  public String getDescription() {
	return description;
  }
  
  public void setDescription(String description) {
	this.description = description;
  }
  
  public String getUri() {
	return uri;
  }
  
  public void setUri(String uri) {
	this.uri = uri;
  }
  
  public String getType() {
	return type;
  }
  
  public void setType(String type) {
	this.type = type;
  }

  public String getSpecies() {
	return species;
  }

  public void setSpecies(String species) {
	this.species = species;
  }

  public String getGenomeVersion() {
	return genomeVersion;
  }

  public void setGenomeVersion(String genomeVersion) {
	this.genomeVersion = genomeVersion;
  }

  public BrcGeneListBean getIdLists() {
	return idLists;
  }

  public void setIdLists(BrcGeneListBean idLists) {
	this.idLists = idLists;
  }

}
