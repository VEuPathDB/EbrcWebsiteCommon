package org.eupathdb.common.fix;

import static java.util.Map.entry;
import static org.gusdb.fgputil.FormatUtil.NL;
import static org.gusdb.wdk.model.answer.spec.ParamsAndFiltersDbColumnFormat.KEY_PARAMS;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.apache.log4j.Logger;
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

public class MigrateTextSearchToSolrPlugin implements TableRowUpdaterPlugin<StepData> {

  private static final Logger LOG = Logger.getLogger(MigrateTextSearchToSolrPlugin.class);

  private static class SolrSearch {

    private final String _questionName;
    private final String _docType;
    private final Map<String,String> _fieldMap;

    public SolrSearch(String questionName, String docType, Map<String,String> fieldMap) {
      _questionName = questionName;
      _docType = docType;
      _fieldMap = fieldMap;
    }

    public String getQuestionName() {
      return _questionName;
    }

    public String getDocType() {
      return _docType;
    }

    public String getMappedFieldsStableValue(String currentStableValue) {
      List<String> oldFields = AbstractEnumParam.convertToTerms(
          AbstractEnumParam.standardizeStableValue(currentStableValue, true));
      List<String> newFields = oldFields.stream()
          .filter(val -> _fieldMap.containsKey(val))
          .map(val -> _fieldMap.get(val))
          .collect(Collectors.toList());
      return new JSONArray(newFields).toString();
    }
  }

  private static class TextSearchStepDataFactory extends StepDataFactory {

    public TextSearchStepDataFactory() {
      super(false);
    }

    @Override
    public String getRecordsSql(String schema, String projectId) {
      // find old text search steps that are non-Ortho and non-Guest and non-deleted
      return
          "select " + SELECT_COLS_TEXT +
          " from " + schema + "steps s, " + schema + "users u" +
          " where is_deleted = 0" +
          " and question_name like '%Text%'" +
          " and project_id != 'OrthoMCL'" +
          " and u.user_id = s.user_id" +
          " and u.is_guest = 0";
    }
  }

  // NOTE: Commented out fields below are those we are no longer supporting;
  //       they are kept below for documentation and their old values will be removed
  private static final Map<String, SolrSearch> QUESTION_CONVERSIONS = Map.ofEntries(
    entry("GeneQuestions.GenesByTextSearchPhenotype", new SolrSearch(
      "GeneQuestions.GenesByPhenotypeText",
      "gene",
      Map.ofEntries(
        entry("Phenotype", "Phenotype"),
        entry("Rodent Malaria Phenotype", "RodMalPhenotype")
      )
    )),
    entry("GeneQuestions.GenesByTextSearch", new SolrSearch(
      "GeneQuestions.GenesByText",
      "gene",
      Map.ofEntries(
        entry("Alias", "Alias"),
        entry("Cellular localization", "CellularLocalization"),
        //entry("Community annotation", null),
        entry("EC descriptions", "ECNumbers"),
        entry("Gene ID", "primary_key"),
        entry("Gene notes", "Notes"),
        //entry("Genes of previous release", null),
        entry("Gene product", "Products"),
        entry("Gene name", "name"),
        entry("GO terms and definitions", "GOTerms"),
        entry("Metabolic pathway names and descriptions", "MetabolicPathways"),
        entry("Phenotype", "Phenotype"),
        entry("Protein domain names and descriptions", "InterPro"),
        entry("PubMed", "PubMed"),
        entry("Rodent Malaria Phenotype", "RodMalPhenotype"),
        //entry("Similar proteins (BLAST hits v. NRDB/PDB)", null),
        entry("User comments", "UserCommentContent")
      )
    )),
    entry("PopsetQuestions.PopsetsByTextSearch", new SolrSearch(
      "PopsetQuestions.PopsetIsolatesByText",
      "popsetSequence",
      Map.ofEntries(
        entry("Organism", "organism"),
        entry("Description", "description"),
        entry("Strain", "strain"),
        entry("Host", "specific_host"),
        entry("Note", "note"),
        entry("Isolation Source", "isolation_source"),
        entry("Geographic Location", "geographic_location"),
        entry("Reference", "References")
        //entry("Overlapping gene (ID or product)", "null")
      )
    )),
    entry("CompoundQuestions.CompoundsByTextSearch", new SolrSearch(
      "CompoundQuestions.CompoundsByText",
      "compound",
      Map.ofEntries(
        entry("Compound Name", "compound_name"),
        entry("Synonyms", "Synonyms"),
        entry("Metabolic Pathways", "MetabolicPathways"),
        entry("Reactions and Enzymes", "MetabolicPathwayReactions"),
        entry("Definition", "definition"),
        entry("Secondary Identifiers", "SecondaryIds"),
        entry("IUPAC Names", "IupacNames"),
        entry("Properties (InChI, InChIKey, IUPAC Name, SMILES, Molecular Weight)", "Properties")
      )
    ))
  );

  // configuration
  private boolean _performUpdates = false;

  // statistics
  private AtomicInteger _nonMigrateableSearchCount = new AtomicInteger(0);
  private AtomicInteger _stepsConverted = new AtomicInteger(0);

  @Override
  public void configure(WdkModel wdkModel, List<String> additionalArgs) throws Exception {
    _performUpdates = !additionalArgs.isEmpty() && additionalArgs.get(0).equals("-write");
  }

  @Override
  public TableRowUpdater<StepData> getTableRowUpdater(WdkModel wdkModel) {
    return new TableRowUpdater<StepData>(new TextSearchStepDataFactory(),
        ListBuilder.asList(new StepDataWriter()), this, wdkModel);
  }

  @Override
  public RowResult<StepData> processRecord(StepData nextRow) throws Exception {
    String originalQuestionName = nextRow.getQuestionName();
    SolrSearch newSearch = QUESTION_CONVERSIONS.get(originalQuestionName);
    if (newSearch == null) {
      // not a search we are migrating; do not need to update
      _nonMigrateableSearchCount.incrementAndGet();
      return new RowResult<>(nextRow);
    }
    JSONObject oldParamFiltersJson = nextRow.getParamFilters();
    JSONObject oldParamJson = JsonUtil.clone(oldParamFiltersJson);
    boolean isOldFormat = true;
    if (oldParamFiltersJson.has(KEY_PARAMS)) {
      oldParamJson = oldParamFiltersJson.getJSONObject(KEY_PARAMS);
      isOldFormat = false;
    }
    // build new param JSON for this question
    JSONObject newParamJson = new JSONObject()
      .put("text_expression", oldParamJson.getString("text_expression"))
      .put("document_type", newSearch.getDocType())
      .put("text_fields", newSearch.getMappedFieldsStableValue(oldParamJson.getString("text_fields")));
    if (oldParamJson.has("text_search_organism")) {
      newParamJson.put("text_search_organism", oldParamJson.get("text_search_organism"));
    }
    JSONObject newParamFiltersJson;
    if (isOldFormat) {
      // only add params to create new format
      newParamFiltersJson = new JSONObject().put(KEY_PARAMS, newParamJson);
    }
    else {
      newParamFiltersJson = JsonUtil.clone(oldParamFiltersJson).put(KEY_PARAMS, newParamJson);
      newParamFiltersJson.remove("viewFilters");
    }
    nextRow.setQuestionName(newSearch.getQuestionName());
    nextRow.setParamFilters(newParamFiltersJson);
    LOG.info("Converting question " + originalQuestionName + " to " + newSearch.getQuestionName() + NL +
      "Old = " + oldParamFiltersJson.toString(2) + NL +
      "New = " + newParamFiltersJson.toString(2));
    _stepsConverted.incrementAndGet();
    return new RowResult<>(nextRow).setShouldWrite(_performUpdates);
  }

  @Override
  public void dumpStatistics() {
    LOG.info("Ignored (could not migrate) " + _nonMigrateableSearchCount.get() + " steps.");
    LOG.info("Converted a total of " + _stepsConverted.get() + " steps.");
  }

}
