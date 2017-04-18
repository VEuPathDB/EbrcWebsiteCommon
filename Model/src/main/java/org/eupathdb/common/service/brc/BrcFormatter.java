package org.eupathdb.common.service.brc;

import java.util.Set;

import org.gusdb.wdk.model.WdkModelException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class BrcFormatter {
	
  public static JSONArray getJson(Set<BrcBean> beans) throws JSONException, WdkModelException {
	JSONArray array = new JSONArray();
	for(BrcBean bean : beans) {
	  array.put(getBrcJson(bean, true));
	}
	return array;
  }

  public static JSONObject getBrcJson(BrcBean bean, boolean search) throws JSONException, WdkModelException {
	BrcGeneListBean idLists = bean.getIdLists();
    JSONArray idListsJson = new JSONArray();
    JSONObject idListJson = getGeneListJson(idLists, search);
    idListsJson.put(idListJson);
    return new JSONObject()
      .put("experimentIdentifier", bean.getExperimentIdentifier())
      .put("displayName", bean.getDisplayName())
      .put("type", bean.getType())
      .put("description", bean.getDescription())
      .put("uri", bean.getUri())
      .put("species", bean.getSpecies())
      .put("genomeVersion", bean.getGenomeVersion())
      .put("idLists", idListsJson);
  }
  
  public static JSONObject getGeneListJson(BrcGeneListBean bean, boolean search) {
    JSONObject json = new JSONObject()
      .put("listIdentifier", bean.getListIdentifier())
      .put("displayName", bean.getDisplayName())
      .put("description", bean.getDescription())
      .put("uri", bean.getUri())
      .put("type", bean.getType())
      .put("provenance", bean.getProvenance()); 
    if(search) {
      json
        .put("significance", bean.getSignificance())
        .put("significanceType", bean.getSignificanceType());
    }
    return json;
  }

}
