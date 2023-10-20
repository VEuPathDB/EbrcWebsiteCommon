package org.eupathdb.common.fix.eda;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.json.JSONArray;
import org.json.JSONObject;

public class Build66 extends EdaAnalysisMigrator {

  private static final Logger LOG = LogManager.getLogger(Build66.class);

  // statistics
  private int _numRows = 0;
  private int _numComputes = 0;
  private int _numUpdatedComputes = 0;
  private int _numSkippedComputes = 0;
  private int _numUpdatedRows = 0;
  private int _numErrors = 0;

  @Override
  public RowResult<EdaAnalysisRow> processRecord(EdaAnalysisRow nextRow) throws Exception {
    _numRows++;
    try {
      JSONArray computations = nextRow.getDescriptor().getJSONArray("computations");
      boolean performUpdate = false;
      for (int i = 0; i < computations.length(); i++) {
        _numComputes++;

        JSONObject descriptor = computations.getJSONObject(i).getJSONObject("descriptor");

        // check for presence of configuration; some computes default to an undefined configuration; this is fine to skip
        if (!descriptor.has("configuration")) {
          _numSkippedComputes++;
          continue;
        }

        JSONObject collectionVar = descriptor
            .getJSONObject("configuration")
            .getJSONObject("collectionVariable");

        // check for new format; if present, then no change needed
        if (collectionVar.has("collectionId") && !collectionVar.has("variableId")) {
          _numSkippedComputes++;
          continue;
        }

        // save off variable ID, then remove variableId property and replace with collectionId
        String collectionId = collectionVar.getString("variableId");
        collectionVar.remove("variableId");
        collectionVar.put("collectionId", collectionId);
        performUpdate = true;
        _numUpdatedComputes++;
      }
      if (performUpdate) _numUpdatedRows++;
      return new RowResult<>(nextRow).setShouldWrite(isPerformUpdates() && performUpdate);
    }
    catch (Exception e) {
      LOG.error("Error processing row '" + nextRow.getAnalysisId() + "'", e);
      _numErrors++;
      return new RowResult<>(nextRow).setShouldWrite(false);
    }
  }

  @Override
  public void dumpStatistics() {
    LOG.info(new JSONObject()
        .put("numRows", _numRows)
        .put("numComputes", _numComputes)
        .put("numUpdatedComputes", _numUpdatedComputes)
        .put("numSkippedComputes", _numSkippedComputes)
        .put("numUpdatedRows", _numUpdatedRows)
        .put("numErrors", _numErrors)
        .toString(2));
  }

}
