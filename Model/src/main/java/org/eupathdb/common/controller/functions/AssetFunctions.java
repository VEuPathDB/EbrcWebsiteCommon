package org.eupathdb.common.controller.functions;

import javax.servlet.ServletContext;
import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

public class AssetFunctions {

  private static final String MANIFEST_FILE = "assets-manifest.json";
  private static final Logger logger = Logger.getLogger(AssetFunctions.class);
  private static JSONObject manifestJSON;
  private static boolean didAttemptToLoad = false;

  private static void loadChecksums(ServletContext svc) {
    if (!didAttemptToLoad) {
      try {
        JSONTokener jt = new JSONTokener(svc.getResourceAsStream(MANIFEST_FILE));
        manifestJSON = new JSONObject(jt);
      }
      catch (JSONException je) {
        logger.error(MANIFEST_FILE + " contains a syntax error.");
        logger.debug(je);
      }
      catch (NullPointerException npe) {
        logger.warn(MANIFEST_FILE + " not found. No URLs will be rewritten.");
      }
      finally {
        didAttemptToLoad = true;
      }
    }
  }

  public static String doFingerprint(String url, ServletContext svc) {
    loadChecksums(svc);
    try {
      if (manifestJSON != null) {
        String qs = "";
        if (url != null) {
          // remove whitespace and slice off query string
          url = url.trim();
          Integer qIndex = url.indexOf('?');
          if (qIndex > -1) {
            qs = url.substring(qIndex);
            url = url.substring(0, qIndex);
          }
        }
        JSONObject fileInfo = manifestJSON.getJSONObject("files").getJSONObject(url);
        String checksum = fileInfo.getString("checksum");
        if (checksum != null) {
          Integer extIndex = url.lastIndexOf('.');
          String srcBase = url.substring(0, extIndex);
          String srcExt = url.substring(extIndex);
          url = srcBase + "-" + checksum + srcExt;
        }
        // add back the query string
        url += qs;
      }
    }
    catch (JSONException je) {
      logger.error("Unable to get checksum for \"" + url + "\" from " +
          MANIFEST_FILE + ". Using plain url.");
      logger.debug(je);
    }
    return url;
  }
}
