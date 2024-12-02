package org.eupathdb.common.fix.eda;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowUpdaterPlugin;
import org.gusdb.wdk.model.fix.table.TableRowUpdater;

public abstract class EdaAnalysisMigrator implements TableRowUpdaterPlugin<EdaAnalysisRow> {

  public static final Map<String,String> SCHEMA_MAP = new HashMap<>() {{
    put("ClinEpiDB", "edauserce.");
    put("MicrobiomeDB", "edausermb.");
    put("VectorBase", "edauservb.");
  }};

  private boolean _performUpdates;
  private String _schema;

  @Override
  public void configure(WdkModel wdkModel, List<String> additionalArgs) throws Exception {

    // only write if user adds -write argument
    _performUpdates = additionalArgs.size() == 1 && additionalArgs.get(0).equals("-write");

    // for now, use projectId of the model to determine EDA user schema; may want to pass this as an argument in the future
    if (!SCHEMA_MAP.containsKey(wdkModel.getProjectId())) {
      throw new IllegalStateException("This plugin can only be run with project IDs: " + String.join(", ", SCHEMA_MAP.keySet()));
    }
    _schema = SCHEMA_MAP.get(wdkModel.getProjectId());
  }

  @Override
  public TableRowUpdater<EdaAnalysisRow> getTableRowUpdater(WdkModel wdkModel) {
    // can use the same factory for reading/writing
    EdaAnalysisDataFactory factory = new EdaAnalysisDataFactory(_schema);
    return new TableRowUpdater<>(factory, factory, this, wdkModel);
  }

  protected boolean isPerformUpdates() {
    return _performUpdates;
  }

}
