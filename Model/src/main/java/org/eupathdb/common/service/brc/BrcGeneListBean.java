package org.eupathdb.common.service.brc;

import java.util.HashSet;
import java.util.Set;

import org.gusdb.wdk.model.WdkModelException;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * A bean holding the idlist information to be send back in a BRC response.
 * @author crisl-adm
 *
 */
public class BrcGeneListBean {
  private String listIdentifier;
  private String displayName;
  private String description;
  private String uri;
  private String type;
  private String provenance;
  private String t11;
  private String t12;
  private String t21;
  private String t22;
  private String significance;
  private String significanceType;
  private Set<String> ids;

  /**
   * Convert the WDK record response into a BRC Gene List bean object.  Again, the answer
   * flag distinguishes between a search request that provides additional attributes and
   * a record request.
   * @param recordJson
   * @param answer - true if a search request (i.e., WDK answer returned), false otherwise
   * @return
   * @throws WdkModelException
   */
  public static BrcGeneListBean parseRecordGeneListJson(JSONObject recordJson, String exptServiceUri, boolean answer) throws WdkModelException {
	BrcGeneListBean brcGeneListBean = new BrcGeneListBean();
	brcGeneListBean.setListIdentifier(
	  String.valueOf(((JSONObject)recordJson.getJSONArray("id").get(0)).get("value"))
	);
	brcGeneListBean.setDisplayName("NA");
	brcGeneListBean.setDescription("NA");
	String geneListIdsUri = exptServiceUri + "/gene-list/" + brcGeneListBean.getListIdentifier() + "/ids";
	brcGeneListBean.setUri(geneListIdsUri);
	brcGeneListBean.setType("NA");
	brcGeneListBean.setProvenance("NA");
	JSONObject attributesJson = recordJson.getJSONObject("attributes");
	if(answer) {
	    brcGeneListBean.setT11(String.valueOf(attributesJson.get("overlap")));
	    brcGeneListBean.setT12(String.valueOf(attributesJson.get("ul_nonDS")));
	    brcGeneListBean.setT21(String.valueOf(attributesJson.get("ds_nonUL")));
	    brcGeneListBean.setT22(String.valueOf(attributesJson.get("nonUL_nonDS")));
	    brcGeneListBean.setSignificanceType("p value");
	    brcGeneListBean.setSignificance(String.valueOf(attributesJson.get("p_value")));

	}
	else {
	  JSONObject tablesJson = recordJson.getJSONObject("tables");
	  JSONArray datasetGeneTableJson = tablesJson.getJSONArray("DatasetGeneTable");  
	  Set<String> geneIds = new HashSet<>();
	  for(int i = 0; i < datasetGeneTableJson.length(); i++) {
        String geneId = String.valueOf(((JSONObject) datasetGeneTableJson.get(i)).get("source_id"));
        geneIds.add(geneId);
	  }
	  brcGeneListBean.setIds(geneIds);
	}  
	return brcGeneListBean;
  }
  
  public String getListIdentifier() {
	return listIdentifier;
  }
  
  public void setListIdentifier(String listIdentifier) {
	this.listIdentifier = listIdentifier;
  }
  
  public String getDisplayName() {
	return displayName;
  }
  
  public void setDisplayName(String displayName) {
	this.displayName = displayName;
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
  
  public String getProvenance() {
	return provenance;
  }
  
  public void setProvenance(String provenance) {
	this.provenance = provenance;
  }
  
  public String getT11() {
	return t11;
  }
  
  public void setT11(String t11) {
	this.t11 = t11;
  }
  public String getT12() {
	return t12;
  }
  
  public void setT12(String t12) {
	this.t12 = t12;
  }
  public String getT21() {
	return t21;
  }
  
  public void setT21(String t21) {
	this.t21 = t21;
  }
  public String getT22() {
	return t22;
  }
  
  public void setT22(String t22) {
	this.t22 = t22;
  }
  public String getSignificance() {
	return significance;
  }
  
  public void setSignificance(String significance) {
	this.significance = significance;
  }
  
  public String getSignificanceType() {
	return significanceType;
  }
  
  public void setSignificanceType(String significanceType) {
	this.significanceType = significanceType;
  }

  public String getDescription() {
	return description;
  }

  public void setDescription(String description) {
	this.description = description;
  }

  public Set<String> getIds() {
	return ids;
  }

  public void setIds(Set<String> ids) {
	this.ids = ids;
  }

}
