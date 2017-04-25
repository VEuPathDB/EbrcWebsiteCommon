package org.eupathdb.common.service.brc;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Hardcoded JSON object in support of a BRC API request.
 * @author crisl-adm
 *
 */
public class ApiFormatter {
	
  public static JSONObject getJson() {
	return new JSONObject()
	  .put("inputTypes", new JSONArray()
	    .put(new JSONObject()
		  .put("type", "gene")
		  .put("displayName", "Gene Set")
		  .put("description", "A list of genes to match against experiments")
		  .put("idSources", new JSONArray()
            .put("ensembl"))
		  .put("thresholdTypes", new JSONArray()
            .put(new JSONObject()
              .put("name", "Percent matched")
              .put("display_name", "Percent matched")
              .put("min", 0)
              .put("max", 100)))
		  .put("additionalFlags", new JSONArray()
		    .put(new JSONObject()
			  .put("key","useOrthology")
			  .put("jsonType", "boolean")))));
  }
}
