package org.eupathdb.common.fix;

import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.ListBuilder;
import org.gusdb.fgputil.json.JsonType;
import org.gusdb.fgputil.json.JsonUtil;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.answer.spec.ParamsAndFiltersFormat;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowUpdaterPlugin;
import org.gusdb.wdk.model.fix.table.TableRowUpdater;
import org.gusdb.wdk.model.fix.table.steps.StepData;
import org.gusdb.wdk.model.fix.table.steps.StepDataFactory;
import org.gusdb.wdk.model.fix.table.steps.StepDataWriter;
import org.gusdb.wdk.model.query.param.FilterParamNew;
import org.gusdb.wdk.model.query.param.Param;
import org.gusdb.wdk.model.question.Question;
import org.json.JSONArray;
import org.json.JSONException;
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
  private boolean _writeToDb;
  private int[] _counts = { 0, 0, 0, 0 };

  @Override
  public void configure(WdkModel wdkModel, List<String> additionalArgs) throws Exception {
    _wdkModel = wdkModel;
    _writeToDb = !additionalArgs.isEmpty() && additionalArgs.get(0).equals("-write");
  }

  @Override
  public TableRowUpdater<StepData> getTableRowUpdater(WdkModel wdkModel) {
    return new TableRowUpdater<StepData>(
        new StepDataFactory(false),
        ListBuilder.asList(new StepDataWriter()),
        this, wdkModel);
  }

  @Override
  public RowResult<StepData> processRecord(StepData nextRow) throws Exception {
    try {
      RowResult<StepData> result = new RowResult<>(nextRow);
      Question question = _wdkModel.getQuestionByName(nextRow.getQuestionName()).orElse(null);
      if (question == null) {
        // question name is invalid; skip this row without error
        _counts[ResultType.BAD_QUESTION.ordinal()]++;

      }
      Map<String, Param> questionParams = question.getParamMap();
      JSONObject json = nextRow.getParamFilters();
      JSONObject params = json.getJSONObject(ParamsAndFiltersFormat.KEY_PARAMS);
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
      return result.setShouldWrite(valueChanged && _writeToDb);
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
   *
   * The format for FilterParamNew stable value is as follows (in TypeScript):
   *
   *    interface MemberValue<T> extends Array<T> {}
   *
   *    interface RangeValue<T> {
   *      min: T | null;
   *      max: T | null;
   *    }
   *
   *    interface FilterBase {
   *      field: string;
   *      type: string;
   *      isRange: boolean;
   *      includeUnknown: boolean;
   *      value: any;
   *    }
   *
   *    interface StringFilter extends FilterBase {
   *      type: 'string';
   *      value: MemberValue<string>;
   *    }
   *
   *    interface DateFilter extends FilterBase {
   *      type: 'date';
   *      value: MemberValue<string> | RangeValue<string>;
   *    }
   *
   *    interface NumberFilter extends FilterBase {
   *      type: 'number';
   *      value: MemberValue<number> | RangeValue<number>;
   *    }
   *
   *    type Filter = StringFilter | DateFilter | NumberFilter;
   *
   *    interface FilterParamStableValue {
   *      filters: Filter[]
   *    }
   *
   *
   * The primary differences between the old FilterParam stable value and the new FilterParam
   * stable value are:
   *   - old doesn't have `isRange` or `includeUnknown`
   *   - old does have some extra properties that are not needed: `values`, `ignored`, `selection`
   *
   * @param oldValue JSON value of a FilterParamNew
   * @return new JSON value, or null if already in FilterParamNew format
   */
  private JSONObject convertParamValue(JSONObject oldValue) throws Exception {
    // TODO convert FilterParam(Old) value to FilterParamNew value

    // If `values` property is missing, assume it is FilterParamNew stable value.
    if (!oldValue.has("values")) {
      System.out.println("Skipping param since value appears new.");
      return oldValue;
    }

    if (!oldValue.has("filters")) oldValue.put("filters", new JSONArray());

    JSONArray filtersJson = oldValue.getJSONArray("filters");
    JSONArray newFiltersJson = new JSONArray();

    for (int i = 0; i < filtersJson.length(); i++ ) {
      JSONObject filterJson = filtersJson.getJSONObject(i);
      String field = filterJson.getString("field");

      // Default values... we will attempt to infer below
      String type = "string";
      Object value = null;
      Boolean isRange = false;
      Boolean includeUnknown = false;

      // If filter has `type` property, it will have the rest of these values.
      // `type` was added after these other props
      if (filterJson.has("type")) {
        type = filterJson.getString("type");
        value = filterJson.has("value") ? filterJson.get("value") : null;
        isRange = filterJson.getBoolean("isRange");
        includeUnknown = filterJson.getBoolean("includeUnknown");
      }

      else if (filterJson.has("value")) {
        try {
          JSONArray memberValueJson = filterJson.getJSONArray("value");
          isRange = false;
          for (int j = 0; j < memberValueJson.length(); j++) {
            if (memberValueJson.isNull(j) || memberValueJson.get(j).equals("unknown")) {
              includeUnknown = true;
              memberValueJson.remove(j);
              j--;
            }
          }
          if (memberValueJson.length() == 0) {
            type = "string";
          } else {
            JsonType jsonType = new JsonType(memberValueJson.get(0));
            switch (jsonType.getType()) {
              case STRING:
                type = "string";
                break;

              case NUMBER:
                type = "number";
                break;

              default:
                throw new Exception("Unknown value type: " + jsonType.getType() + "\n" + memberValueJson.toString(4));
            }
          }
          value = memberValueJson;
        } catch (JSONException memberEx) {
          try {
            JSONObject rangeValueJSON = filterJson.getJSONObject("value");
            isRange = true;
            JsonType minType = new JsonType(rangeValueJSON.has("min") ? rangeValueJSON.get("min") : JSONObject.NULL);
            JsonType maxType = new JsonType(rangeValueJSON.has("max") ? rangeValueJSON.get("max") : JSONObject.NULL);
            JsonType sampleType = minType.isNull() ? maxType : minType;

            switch (sampleType.getType()) {
              case STRING:
                if (!minType.isNull()) rangeValueJSON.put("min", Double.parseDouble(rangeValueJSON.getString("min")));
                if (!maxType.isNull()) rangeValueJSON.put("max", Double.parseDouble(rangeValueJSON.getString("max")));
                type = "number";
                break;

              case NUMBER:
              case NULL:
                type = "number";
                break;

              default:
                throw new Exception("Unknown range type: " + sampleType.getType());
            }
            value = rangeValueJSON;
          } catch (JSONException rangeEx) {
            throw new Exception("Unexpected `value` property in filter JSON:\n" + filterJson.toString(4));
          }
        }
      }

      newFiltersJson.put(i, new JSONObject()
          .put("field", field)
          .put("type", type)
          .put("isRange", isRange)
          .put("includeUnknown", includeUnknown)
          .put("value", value));
    }
    JSONObject newValue = new JSONObject()
        .put("filters", newFiltersJson);
    System.out.println("Updated stable value:\n" + newValue.toString(4));
    return newValue;
  }

  @Override
  public void dumpStatistics() {
    LOG.info("Plugin Statistics:");
    for (ResultType type : ResultType.values()) {
      LOG.info("  " + type.toString() + ": " + _counts[type.ordinal()]);
    }
  }
}
