package org.eupathdb.common.service.brc;

import org.gusdb.wdk.model.WdkModelException;
import org.json.JSONObject;

public class BrcGeneListBean {
  private String listIdentifier;
  private String displayName;
  private String description;
  private String uri;
  private String type;
  private String provenance;
  private String significance;
  private String significanceType;

  public static BrcGeneListBean parseRecordGeneListJson(JSONObject recordJson, boolean answer) throws WdkModelException {
	BrcGeneListBean brcGeneListBean = new BrcGeneListBean();
	brcGeneListBean.setListIdentifier(
	  String.valueOf(((JSONObject)recordJson.getJSONArray("id").get(0)).get("value"))
	);
	brcGeneListBean.setDisplayName("NA");
	brcGeneListBean.setDescription("NA");
	brcGeneListBean.setUri("NA");
	brcGeneListBean.setType("NA");
	brcGeneListBean.setProvenance("NA");
	JSONObject attributesJson = recordJson.getJSONObject("attributes");
	if(answer) {
	  brcGeneListBean.setSignificanceType("Percent matched");
	  brcGeneListBean.setSignificance(String.valueOf(attributesJson.get("percent_count")));
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

}
