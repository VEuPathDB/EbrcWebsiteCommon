package org.eupathdb.common.service.brc;

import java.util.Set;

import org.gusdb.wdk.model.WdkModelException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Formats BRC bean back into BRC JSON responses. 
 * @author crisl-adm
 *
 */
public class BrcFormatter {

  /**
   * Converts a set of BRC beans into a BRC response to a BRC search request.	
   * @param beans
   * @return
   * @throws JSONException
   * @throws WdkModelException
   */
  public static JSONArray getJson(Set<BrcBean> beans) throws JSONException, WdkModelException {
	JSONArray array = new JSONArray();
	for(BrcBean bean : beans) {
	  array.put(getBrcJson(bean, true));
	}
	return array;
  }

  /**
   * Converts a BRC bean into a BRC response to a BRC search or experiment request.  Since some
   * idlist information is irrelevant in the case of a simple experiment record retrieval, a 
   * flag is provided to distinguish between the two request types.
   * @param bean
   * @param search - true if a search, false otherwise
   * @return
   * @throws JSONException
   * @throws WdkModelException
   */
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
  
  /**
   * Convenience method to populate the gene list portion of the experiment record
   * @param bean
   * @param search
   * @return
   */
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
        .put("c11", bean.getC11())
        .put("c22", bean.getC22())
        .put("c33", bean.getC33())
        .put("c44", bean.getC44())
        .put("c55", bean.getC55())
        .put("significance", bean.getSignificance())
        .put("significanceType", bean.getSignificanceType());
    }
    return json;
  }
  
  /**
   * Returns an JSON array of gene list ids in response to a gene list ids
   * request.
   * @param bean
   * @return
   */
  public static JSONArray getGeneListIdsJson(BrcGeneListBean bean) {
    JSONArray idsJson = new JSONArray();
    for(String id : bean.getIds()) {
      idsJson.put(id);
    }
    return idsJson;
  }

}
