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
  private int _numErrors = 0;
  private int _numComputes = 0;
  private int _numUpdatedComputes = 0;

  @Override
  public RowResult<EdaAnalysisRow> processRecord(EdaAnalysisRow nextRow) throws Exception {
    _numRows++;
    try {
      JSONArray computations = nextRow.getDescriptor().getJSONArray("computations");
      for (int i = 0; i < computations.length(); i++) {
        _numComputes++;
        JSONObject collectionVar = computations.getJSONObject(i)
            .getJSONObject("descriptor")
            .getJSONObject("configuration")
            .getJSONObject("collectionVariable");
        // save off variable ID, then remove variableId property and replace with collectionId
        String collectionId = collectionVar.getString("variableId");
        collectionVar.remove("variableId");
        collectionVar.put("collectionId", collectionId);
      }
      _numUpdatedComputes++;
      return new RowResult<>(nextRow).setShouldWrite(isPerformUpdates());
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
        .put("numErrors", _numErrors)
        .put("numComputes", _numComputes)
        .put("numUpdatedComputes", _numUpdatedComputes)
        .toString(2));
  }

}
