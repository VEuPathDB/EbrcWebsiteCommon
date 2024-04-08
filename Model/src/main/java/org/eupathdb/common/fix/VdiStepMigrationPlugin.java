package org.eupathdb.common.fix;

import org.apache.log4j.Logger;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.fix.VdiMigrationFileReader;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowUpdaterPlugin;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowWriter;
import org.gusdb.wdk.model.fix.table.TableRowUpdater;
import org.gusdb.wdk.model.fix.table.steps.StepData;
import org.gusdb.wdk.model.fix.table.steps.StepDataFactory;
import org.gusdb.wdk.model.fix.table.steps.StepDataWriter;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.List;
import java.util.Map;

public class VdiStepMigrationPlugin implements TableRowUpdaterPlugin<StepData>{

  private static final Logger LOG = Logger.getLogger(VdiStepMigrationPlugin.class);

  private boolean _write;
  private Map<String, String> _legacyIdToVdiId;

  @Override
  public void configure(WdkModel wdkModel, List<String> args) throws Exception {
    final File tinyDbFile = new File(args.get(0));
    _write = args.size() > 1 && args.get(args.size() - 1).equals("-write");
    VdiMigrationFileReader migrationFileReader = new VdiMigrationFileReader(tinyDbFile);
    _legacyIdToVdiId = migrationFileReader.readLegacyStudyIdToVdiId();
  }

  @Override
  public TableRowUpdater<StepData> getTableRowUpdater(WdkModel wdkModel) {
    TableRowInterfaces.TableRowFactory<StepData> rowFactory = new StepDataFactory(false);
    TableRowWriter<StepData> rowWriter = new StepDataWriter();
    return new TableRowUpdater<>(rowFactory, rowWriter, this, wdkModel);
  }

  @Override
  public RowResult<StepData> processRecord(StepData step) throws Exception {
    if (step.getQuestionName().equals("GeneQuestions.GenesByUserDatasetGeneList")) {
      return migrateUdStep(step, "geneListUserDataset");
    } else if (step.getQuestionName().equals("GeneQuestions.GenesByRNASeqUserDataset")) {
      return migrateUdStep(step, "rna_seq_dataset");
    }
    return new RowResult<>(step)
        .setShouldWrite(false);
  }

  private RowResult<StepData> migrateUdStep(StepData step, String paramName) {
    JSONObject params = step.getParamFilters().getJSONObject("params");

    LOG.info("STEP BEFORE MIGRATION: " + step.getStepId() + " params: " + params);
    // Raw ID is stored as a stringified JSON list with a singular ID in it (i.e. [\"1234\"])
    String rawLegacyId = params.getString(paramName);
    JSONArray parsedLegacyId = new JSONArray(rawLegacyId);
    String legacyId = parsedLegacyId.getString(0);
    String vdiId = _legacyIdToVdiId.get(legacyId);

    // Re-wrap the migrated ID as a JSON list with a singular item.
    params.put(paramName, "[\"" + vdiId + "\"]");
    LOG.info("UD MAPPING: " + step.getStepId() + " legacy: " + legacyId + ". VDI: " + vdiId);
    LOG.info("STEP AFTER MIGRATION: " + step.getStepId() + " params: " + params);

    return new RowResult<>(step)
        .setShouldWrite(_write);
  }

  @Override
  public void dumpStatistics() {
    // no statistics collected
  }
}
