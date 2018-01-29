package org.eupathdb.common.fix;

import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.ListBuilder;
import org.gusdb.fgputil.json.JsonUtil;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowUpdaterPlugin;
import org.gusdb.wdk.model.fix.table.TableRowUpdater;
import org.gusdb.wdk.model.fix.table.steps.StepData;
import org.gusdb.wdk.model.fix.table.steps.StepDataFactory;
import org.gusdb.wdk.model.fix.table.steps.StepDataWriter;
import org.gusdb.wdk.model.query.param.FilterParamNew;
import org.gusdb.wdk.model.query.param.Param;
import org.gusdb.wdk.model.user.Step;
import org.json.JSONObject;

public class FilterParam2FilterParamNewMigrationPlugin implements TableRowUpdaterPlugin<StepData> {

  private static final Logger LOG = Logger.getLogger(FilterParam2FilterParamNewMigrationPlugin.class);

  private static enum ResultType {
    BAD_QUESTION,
    NO_CHANGE,
    VALUE_CHANGED,
    ERROR
  }

  private WdkModel _wdkModel;
  private int[] _counts = { 0, 0, 0, 0 };

  @Override
  public void configure(WdkModel wdkModel, List<String> additionalArgs) throws Exception {
    _wdkModel = wdkModel;
  }

  @Override
  public TableRowUpdater<StepData> getTableRowUpdater(WdkModel wdkModel) {
    return new TableRowUpdater<StepData>(new StepDataFactory(false),
        ListBuilder.asList(new StepDataWriter()), this, wdkModel);
  }

  @Override
  public RowResult<StepData> processRecord(StepData nextRow) throws Exception {
    try {
      RowResult<StepData> result = new RowResult<>(nextRow);
      Map<String, Param> questionParams;
      try {
        questionParams = _wdkModel.getQuestion(nextRow.getQuestionName()).getParamMap();
      }
      catch(WdkModelException e) {
        // question name is invalid; skip this row without error
        _counts[ResultType.BAD_QUESTION.ordinal()]++;
        return result;
      }
      JSONObject json = nextRow.getParamFilters();
      JSONObject params = json.getJSONObject(Step.KEY_PARAMS);
      boolean valueChanged = false;
      for (String paramName : JsonUtil.getKeys(params)) {
        if (questionParams.get(paramName) instanceof FilterParamNew) {
          // need to convert to FilterParamNew
          JSONObject oldValue = new JSONObject(params.getString(paramName));
          JSONObject newValue = convertParamValue(oldValue);
          if (newValue != null) {
            params.put(paramName, newValue.toString());
            valueChanged = true;
          }
        }
      }
      _counts[(valueChanged ? ResultType.VALUE_CHANGED : ResultType.NO_CHANGE).ordinal()]++;
      return result.setShouldWrite(valueChanged);
    }
    catch (Exception e) {
      _counts[ResultType.ERROR.ordinal()]++;
      throw e;
    }
  }

  /**
   * Takes a look at JSON value of a FilterParamNew.  Format MAY be that of an old FilterParam.  Detects this
   * and if it is in the old format, creates a new JSONObject representing the new format and returns it.  If
   * oldValue is already in the new format, returns null.
   * 
   * @param oldValue JSON value of a FilterParamNew
   * @return new JSON value, or null if already in FilterParamNew format
   */
  private JSONObject convertParamValue(JSONObject oldValue) {

    // TODO convert FilterParam(Old) value to FilterParamNew value

    return oldValue;
  }

  @Override
  public void dumpStatistics() {
    LOG.info("Plugin Statistics:");
    for (ResultType type : ResultType.values()) {
      LOG.info("  " + type.toString() + ": " + _counts[type.ordinal()]);
    }
  }
}
