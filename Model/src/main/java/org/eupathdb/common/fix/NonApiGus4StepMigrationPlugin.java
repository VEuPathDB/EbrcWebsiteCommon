package org.eupathdb.common.fix;

import static org.gusdb.wdk.model.answer.spec.ParamsAndFiltersFormat.KEY_FILTERS;
import static org.gusdb.wdk.model.answer.spec.ParamsAndFiltersFormat.KEY_PARAMS;
import static org.gusdb.wdk.model.answer.spec.ParamsAndFiltersFormat.KEY_VIEW_FILTERS;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.ListBuilder;
import org.gusdb.fgputil.json.JsonIterators;
import org.gusdb.fgputil.json.JsonType;
import org.gusdb.fgputil.json.JsonType.ValueType;
import org.gusdb.fgputil.json.JsonUtil;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowUpdaterPlugin;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowWriter;
import org.gusdb.wdk.model.fix.table.TableRowUpdater;
import org.gusdb.wdk.model.fix.table.steps.StepData;
import org.gusdb.wdk.model.fix.table.steps.StepDataFactory;
import org.gusdb.wdk.model.fix.table.steps.StepDataWriter;
import org.gusdb.wdk.model.fix.table.steps.StepQuestionUpdater;
import org.gusdb.wdk.model.query.param.FilterParamNew;
import org.gusdb.wdk.model.query.param.Param;
import org.gusdb.wdk.model.question.Question;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class NonApiGus4StepMigrationPlugin implements TableRowUpdaterPlugin<StepData>{

  private static final Logger LOG = Logger.getLogger(NonApiGus4StepMigrationPlugin.class);

  private static final String USE_BOOLEAN_FILTER_PARAM = "use_boolean_filter";

  private static final AtomicInteger INVALID_STEP_COUNT_PARAMS = new AtomicInteger(0);

  private WdkModel _wdkModel;
  private StepQuestionUpdater _qNameUpdater;

  @Override
  public void configure(WdkModel wdkModel, List<String> args) throws Exception {
    _wdkModel = wdkModel;
    if (args.size() > 0) {
      _qNameUpdater = new StepQuestionUpdater(args.get(0), false);
    }
  }

  @Override
  public TableRowUpdater<StepData> getTableRowUpdater(WdkModel wdkModel) {
    return new TableRowUpdater<StepData>(new StepDataFactory(false),
        new ListBuilder<TableRowWriter<StepData>>()
        .add(new StepDataWriter())
        .add(new UpdatedStepWriter())
        .toList(), this, wdkModel);
  }

  @Override
  public RowResult<StepData> processRecord(StepData step) throws Exception {
    boolean modified = false;

    // 1. Update question names from mapper file if provided
    if (_qNameUpdater != null) {
      modified |= _qNameUpdater.updateQuestionName(step);
    }

    // 2. If "params" prop not present then place entire paramFilters inside and write back
    modified |= updateParamsProperty(step);

    // 3. Add "filters" property if not present and convert any found objects to filter array
    modified |= updateFiltersProperty(step, KEY_FILTERS);
    modified |= updateFiltersProperty(step, KEY_VIEW_FILTERS);

    // 4. Remove use_boolean_filter param when found
    modified |= removeUseBooleanFilterParam(step);

    // 5. Some steps have both a params property and params as top-level properties in display_params; remove the latter
    modified |= removeOldDisplayParamProps(step);

    // Look up question for the current step; needs to be done after #1 so we are reading new question names.
    // Use (possibly already modified) question name to look up question in the current model.
    Question question = _wdkModel.getQuestionByName(step.getQuestionName()).orElse(null);
    if (question == null) {
      LOG.warn("Question name " + step.getQuestionName() + " does not appear in the WDK model");
      return new RowResult<StepData>(step).setShouldWrite(modified);
    }

    // 6. Filter param format has changed a bit; update existing steps to comply
    modified |= fixFilterParamValues(step, question, true, INVALID_STEP_COUNT_PARAMS);

    return new RowResult<StepData>(step).setShouldWrite(modified);
  }

  @Override
  public void dumpStatistics() {
    // no statistics collected
  }

  public static boolean updateParamsProperty(StepData step) {
    JSONObject paramFilters = step.getParamFilters();
    if (paramFilters.has(KEY_PARAMS)) return false;
    JSONObject newParamFilters = new JSONObject();
    newParamFilters.put(KEY_PARAMS, paramFilters);
    step.setParamFilters(newParamFilters);
    return true;
  }

  public static boolean removeOldDisplayParamProps(StepData step) {
    JSONObject paramFilters = step.getParamFilters();
    // at this point we expect the step to have params, filters, viewFilters, and that's it
    if (paramFilters.has(KEY_PARAMS) &&
        paramFilters.has(KEY_FILTERS) &&
        paramFilters.has(KEY_VIEW_FILTERS) &&
        paramFilters.length() == 3) {
      // found exactly the correct props; do nothing
      return false;
    }
    // otherwise create a new object with just the props we want (they SHOULD already be present)
    JSONObject newParamFilters = new JSONObject();
    newParamFilters.put(KEY_PARAMS, paramFilters.getJSONObject(KEY_PARAMS));
    newParamFilters.put(KEY_FILTERS, paramFilters.getJSONArray(KEY_FILTERS));
    newParamFilters.put(KEY_VIEW_FILTERS, paramFilters.getJSONArray(KEY_VIEW_FILTERS));
    step.setParamFilters(newParamFilters);
    return true;
  }

  public static boolean updateFiltersProperty(StepData step, String filtersKey) {
    JSONObject paramFilters = step.getParamFilters();
    try {
      JsonType json = new JsonType(paramFilters.get(filtersKey));
      if (json.getType().equals(ValueType.ARRAY)) {
        // value is already array; do nothing
        return false;
      }
      // otherwise need to convert to array
    }
    catch (JSONException e) {
      // means filter value not present; add
    }
    paramFilters.put(filtersKey, new JSONArray());
    return true;
  }

  public static boolean removeUseBooleanFilterParam(StepData step) {
    JSONObject params = step.getParamFilters().getJSONObject(KEY_PARAMS);
    if (!params.has(USE_BOOLEAN_FILTER_PARAM)) {
      return false;
    }
    params.remove(USE_BOOLEAN_FILTER_PARAM);
    return true;
  }

  public static boolean fixFilterParamValues(StepData step, Question question,
      boolean logInvalidSteps, AtomicInteger invalidStepCountByParams) throws WdkModelException {
    boolean modifiedByThisMethod = false;
    JSONObject params = step.getParamFilters().getJSONObject(KEY_PARAMS);
    Map<String, Param> qParams = question.getParamMap();
    boolean stepCountedAsInvalid = false;
    int invalidStepsByParam = invalidStepCountByParams.get();
    for (String paramName : JsonUtil.getKeys(params)) {
      if (!qParams.containsKey(paramName)) {
        if (!stepCountedAsInvalid) {
          // only increment invalid step count once for this step (not once for each bad param)
          invalidStepsByParam = invalidStepCountByParams.incrementAndGet();
          stepCountedAsInvalid = true;
        }
        if (logInvalidSteps) {
          LOG.warn("Step " + step.getStepId() +
              " contains param " + paramName + ", no longer required by question " +
              question.getFullName() + " (" + invalidStepsByParam +
              " invalid steps by param).");
        }
        // skip this param but continue to fix other params
        continue;
      }
      Param param = qParams.get(paramName);
      if (!(param instanceof FilterParamNew)) {
        // this fix only applies to filter params
        continue;
      }
      // all filter params must be modified; brand new format
      String paramValue = params.getString(paramName);
      JSONObject filterParamValue = null;
      try {
        // try to parse value as a JSONObject
        filterParamValue = new JSONObject(paramValue);
      }
      catch (JSONException e) {
        // do nothing; we will check filterParamValue for null to decide what to do next
      }

      if (filterParamValue == null) {
        // Model XML says this is a filter param, but value is not JSON;
        //   split on comma and convert to new format:
        //     { values: string[]; ignored: string[]; filters: Filter[]; }
        //   Values may be invalid but at least WDK will be able to parse them.
        String[] values = paramValue.split(",");
        JSONArray valuesArr = new JSONArray();
        for (String value : values) {
          valuesArr.put(value);
        }
        filterParamValue = new JSONObject();
        filterParamValue.put("values", valuesArr);
        filterParamValue.put("ignored", new JSONArray());
        filterParamValue.put("filters", new JSONArray());
        modifiedByThisMethod = true;
      }
      else {
        // value parses as JSON object, but may be a couple different formats; try to figure out which and fix
        JSONArray valueFilters = filterParamValue.getJSONArray("filters");
        for (int i = 0; i < valueFilters.length(); i++) {
          // need to replace each filter object with one in the current format
          JSONObject oldFilter = valueFilters.getJSONObject(i);
          if (alreadyCurrentFilterFormat(oldFilter)) {
            continue;
          }
          modifiedByThisMethod = true;
          JSONObject newFilter = new JSONObject();
          // Add "field" property- should always be a string now
          JsonType oldField = new JsonType(oldFilter.get("field"));
          newFilter.put("field", (oldField.getType().equals(ValueType.OBJECT) ?
              oldField.getJSONObject().getString("term") : // if object, get term property
              oldField.getString()));                      // should be string if not object
          // see if old filter had values property
          if (oldFilter.has("values")) {
            JsonType json = new JsonType(oldFilter.get("values"));
            switch(json.getType()) {
              case OBJECT:
                newFilter.put("value", minMaxToString(json.getJSONObject()));
                break;
              case ARRAY:
                newFilter.put("value", replaceUnknowns(json.getJSONArray()));
                break;
              default:
                throw new WdkModelException("Unexpected value type " +
                    json.getType() + " of value " + json + " in values property.");
            }
          }
          else {
            // really old format; min and max are outside values prop in their own props
            newFilter.put("value", minMaxToString(oldFilter));
          }
          valueFilters.put(i, newFilter);
        }
      }
      params.put(paramName, filterParamValue.toString());
    }
    return modifiedByThisMethod;
  }

  private static boolean alreadyCurrentFilterFormat(JSONObject filterObj) {
    return (
        filterObj.length() == 2 &&
        filterObj.has("field") &&
        filterObj.get("field") instanceof String &&
        filterObj.has("value") &&
        (filterObj.get("value") instanceof JSONObject ||
         filterObj.get("value") instanceof JSONArray)
    );
  }

  private static JSONObject minMaxToString(JSONObject object) {
    try {
      JSONObject newObj = new JSONObject();
      newObj.put("min", getJsonNullOrString(object.get("min")));
      newObj.put("max", getJsonNullOrString(object.get("max")));
      return newObj;
    }
    catch (JSONException e) {
      LOG.error("Could not find min or max properties on object: " + object.toString(2));
      throw e;
    }
  }

  private static Object getJsonNullOrString(Object object) {
    if (object.equals(JSONObject.NULL)) return object;
    return object.toString();
  }

  private static JSONArray replaceUnknowns(JSONArray array) {
    JSONArray newArray = new JSONArray();
    for (JsonType value : JsonIterators.arrayIterable(array)) {
      newArray.put(value.getType().equals(ValueType.STRING) && "Unknown".equals(value.getString()) ?
        JSONObject.NULL : value.get());
    }
    return newArray;
  }
}
