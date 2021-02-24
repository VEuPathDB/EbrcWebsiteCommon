package org.eupathdb.common.fix.organism;

import static org.gusdb.fgputil.FormatUtil.NL;
import static org.gusdb.wdk.model.answer.spec.ParamsAndFiltersDbColumnFormat.KEY_COLUMN_FILTERS;
import static org.gusdb.wdk.model.answer.spec.ParamsAndFiltersDbColumnFormat.KEY_FILTERS;
import static org.gusdb.wdk.model.answer.spec.ParamsAndFiltersDbColumnFormat.KEY_PARAMS;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.FormatUtil;
import org.gusdb.fgputil.ListBuilder;
import org.gusdb.fgputil.json.JsonUtil;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowUpdaterPlugin;
import org.gusdb.wdk.model.fix.table.TableRowUpdater;
import org.gusdb.wdk.model.fix.table.steps.StepData;
import org.gusdb.wdk.model.fix.table.steps.StepDataFactory;
import org.gusdb.wdk.model.fix.table.steps.StepDataWriter;
import org.gusdb.wdk.model.query.param.AbstractEnumParam;
import org.json.JSONArray;
import org.json.JSONObject;

public class MigrateOrganisms implements TableRowUpdaterPlugin<StepData> {

  private static final Logger LOG = Logger.getLogger(MigrateOrganisms.class);

  public interface OrganismMigration {

    public static final String REMOVE_ENTRY = "__NULL__";

    /** @return list of project_ids to apply changes to; null or empty list will imply all projects */
    List<String> getProjectIds();

    /** @return list of org param names to apply the changes to */
    List<String> getOrganismParams();

    /** @return list of conversions; to simply remove a key, use value OrganismMigration.REMOVE_ENTRY */
    Map<String,String> getOrganismMapping();

    /** @return name of organism column filter */
    default String getOrganismColumnFilterName() { return "organism"; }
  }

  private static class OrgMigrationStepDataFactory extends StepDataFactory {

    private final List<String> _projectIds;

    public OrgMigrationStepDataFactory(List<String> projectIds) {
      super(false);
      _projectIds = projectIds;
    }

    @Override
    public String getRecordsSql(String schema, String projectId) {
      String projectFilter = _projectIds == null || _projectIds.isEmpty() ? "" :
          " and project_id in ('" + FormatUtil.join(_projectIds, "','") + "')";
      return
          "select " + SELECT_COLS_TEXT +
          " from " + schema + "steps s, " + schema + "users u" +
          " where is_deleted = 0" +
          projectFilter +
          " and u.user_id = s.user_id" +
          " and u.is_guest = 0";
    }
  }

  // configuration
  private boolean _performUpdates = false;
  private OrganismMigration _config;

  // statistics
  private AtomicInteger _stepsConverted = new AtomicInteger(0);

  @Override
  public void configure(WdkModel wdkModel, List<String> additionalArgs) throws Exception {
    if (additionalArgs.size() < 1 || additionalArgs.size() > 2) {
      LOG.error("USAGE: migrateOrganisms <buildSpecificJavaClassName> [-write]");
      throw new IllegalArgumentException();
    }
    String configClass = getClass().getPackageName() + "." + additionalArgs.get(0);
    _config = (OrganismMigration)Class.forName(configClass).getConstructor().newInstance();
    _performUpdates = additionalArgs.size() == 2 && additionalArgs.get(1).equals("-write");
  }

  @Override
  public TableRowUpdater<StepData> getTableRowUpdater(WdkModel wdkModel) {
    return new TableRowUpdater<StepData>(
        new OrgMigrationStepDataFactory(_config.getProjectIds()),
        ListBuilder.asList(new StepDataWriter()), this, wdkModel);
  }

  /** sample filter JSON
  "columnFilters":{
    "organism":{
      "byValue":{
        "values":[
          "Toxoplasma gondii ME49"
        ]
      }
    }
  },
   */
  @Override
  public RowResult<StepData> processRecord(StepData nextRow) throws Exception {

    JSONObject paramFiltersJson = nextRow.getParamFilters();
    JSONObject oldParamFiltersJson = JsonUtil.clone(paramFiltersJson);

    JSONObject paramsJson = paramFiltersJson.has(KEY_PARAMS) ?
        paramFiltersJson.getJSONObject(KEY_PARAMS) : paramFiltersJson;

    JSONArray filtersJson = paramFiltersJson.has(KEY_FILTERS) ?
        paramFiltersJson.getJSONArray(KEY_FILTERS) : new JSONArray();

    JSONObject columnFiltersJson = paramFiltersJson.has(KEY_COLUMN_FILTERS) ?
        paramFiltersJson.getJSONObject(KEY_COLUMN_FILTERS) : new JSONObject();

    // build new JSON
    boolean jsonChanged = false;

    // look for organism params
    for (String paramName : paramsJson.keySet()) {
      if (_config.getOrganismParams().contains(paramName)) {
        // found an org param; perform mapping
        List<String> orgs = AbstractEnumParam.convertToTerms(
            AbstractEnumParam.standardizeStableValue(
                paramsJson.getString(paramName), true));
        jsonChanged |= replaceInPlace(orgs, _config.getOrganismMapping());
        paramsJson.put(paramName, new JSONArray(orgs));
      }
    }

    // look for organism filter
    for (String filterName : columnFiltersJson.keySet()) {
      if (_config.getOrganismColumnFilterName().equals(filterName)) {
        // found the org filter; perform mapping
        JSONObject byValueObject = columnFiltersJson
            .getJSONObject(_config.getOrganismColumnFilterName())
            .getJSONObject("byValue");
        List<String> orgs = new ArrayList<>(Arrays.asList(JsonUtil.toStringArray(
            byValueObject.getJSONArray("values"))));
        jsonChanged |= replaceInPlace(orgs, _config.getOrganismMapping());
        byValueObject.put("values", new JSONArray(orgs));
      }
    }

    if (jsonChanged) {
      JSONObject newParamFiltersJson = new JSONObject()
        .put(KEY_PARAMS,  paramsJson)
        .put(KEY_FILTERS, filtersJson)
        .put(KEY_COLUMN_FILTERS, columnFiltersJson);
      LOG.info("Will convert param filters JSON" + NL +
          "--OLD--" + NL + oldParamFiltersJson.toString(2) + NL +
          "--NEW--" + NL + newParamFiltersJson.toString(2) + NL);
      nextRow.setParamFilters(newParamFiltersJson);
      _stepsConverted.incrementAndGet();
    }

    return new RowResult<>(nextRow).setShouldWrite(jsonChanged && _performUpdates);
  }

  private static boolean replaceInPlace(List<String> orgs, Map<String,String> mapping) {
    boolean changed = false;
    for (int i = 0; i < orgs.size(); i++) {
      String newValue = mapping.get(orgs.get(i));
      if (newValue == null) {
        // no mapping
        continue;
      }
      if (newValue.equals(OrganismMigration.REMOVE_ENTRY)) {
        orgs.remove(i);
        i--;
        changed = true;
      }
      else {
        orgs.set(i, newValue);
        changed = true;
      }
    }
    return changed;
  }

  @Override
  public void dumpStatistics() {
    LOG.info("Converted a total of " + _stepsConverted.get() + " steps.");
  }

}
