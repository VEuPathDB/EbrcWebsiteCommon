package org.eupathdb.common.fix;

import java.util.List;

import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowUpdaterPlugin;
import org.gusdb.wdk.model.fix.table.TableRowUpdater;
import org.gusdb.wdk.model.fix.table.steps.StepData;
import org.gusdb.wdk.model.fix.table.steps.StepDataFactory;
import org.gusdb.wdk.model.fix.table.steps.StepDataWriter;
import org.json.JSONObject;

public class MigrateLegacyAnswerFiltersPlugin implements TableRowUpdaterPlugin<StepData> {

  private static class LimitedStepRowsSelector extends StepDataFactory {
    public LimitedStepRowsSelector() {
      super(false);
    }
    @Override
    public String getRecordsSql(String schema, String projectId) {
      // TODO: maybe only select step rows that currently have an answer filter value that != all_results
      String basicConditions = "is_deleted = 0 and project_id = '" + projectId + "'";
      return "select " + SELECT_COLS_TEXT + " from " + schema + "steps" +
          (_includeGuestUserSteps ? " where " + basicConditions :
            " s, " + schema + "users u where " + basicConditions + " and u.user_id = s.user_id and u.is_guest = 0");
    }
  }

  // TODO: probably want to use this to help inspect the row (e.g. determine if valid question name)
  private WdkModel _wdkModel;

  @Override
  public void configure(WdkModel wdkModel, List<String> additionalArgs) throws Exception {
    _wdkModel = wdkModel;
    // TODO: may want to pass some args on command line to this plugin?
    //       see FilterParam2FilterParamNewMigrationPlugin; it has option to perform write (i.e. a test mode)
  }

  @Override
  public TableRowUpdater<StepData> getTableRowUpdater(WdkModel wdkModel) {
    return new TableRowUpdater<>(
        new LimitedStepRowsSelector(),
        new StepDataWriter(),
        this,
        wdkModel);
  }

  @Override
  public RowResult<StepData> processRecord(StepData nextRow) throws Exception {

    // read legacy filter name from row
    String legacyAnswerFilterName = nextRow.getLegacyAnswerFilter();

    // TODO: Perform translation of filter name to organism name and convert
    //       to whatever configuration the organism column filter takes.
    JSONObject newParamFiltersJson = nextRow.getParamFilters();

    // Then modify JSON, adding column filters property, etc.
    nextRow.setParamFilters(newParamFiltersJson);

    // TODO: read nextRow and determine changes; safe to modify nextRow
    RowResult<StepData> result = new RowResult<>(nextRow);

    // TODO: after examination, determine if changes need to be made to this record
    boolean needChanges = false;

    result.setShouldWrite(needChanges);
    return result;
  }

  @Override
  public void dumpStatistics() {
    // TODO: log any stats you gather while modifying steps
  }

}
