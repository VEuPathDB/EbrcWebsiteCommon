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
  private String c11;
  private String c22;
  private String c33;
  private String c44;
  private String c55;
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
	    brcGeneListBean.setC11(String.valueOf(attributesJson.get("obser_ovelap")));
	    brcGeneListBean.setC22(String.valueOf(attributesJson.get("exp_overlap")));
	    brcGeneListBean.setC33(String.valueOf(attributesJson.get("fold_enrichment")));
	    brcGeneListBean.setC44(String.valueOf(attributesJson.get("percent_ul")));
	    brcGeneListBean.setC55(String.valueOf(attributesJson.get("percent_ds")));
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
  
  public String getC11() {
	return c11;
  }
  
  public void setC11(String c11) {
	this.c11 = c11;
  }
  public String getC22() {
	return c22;
  }
  
  public void setC22(String c22) {
	this.c22 = c22;
  }
  public String getC33() {
	return c33;
  }
  
  public void setC33(String c33) {
	this.c33 = c33;
  }
  public String getC44() {
	return c44;
  }
  
  public void setC44(String c44) {
	this.c44 = c44;
  }
  public String getC55() {
	return c55;
  }
  
  public void setC55(String c55) {
	this.c55 = c55;
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
