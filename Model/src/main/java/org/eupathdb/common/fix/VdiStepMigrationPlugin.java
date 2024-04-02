package org.eupathdb.common.fix;

import com.fasterxml.jackson.databind.JsonNode;
import org.apache.log4j.Logger;
import org.gusdb.fgputil.json.JsonUtil;
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
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class VdiStepMigrationPlugin implements TableRowUpdaterPlugin<StepData>{

  private static final Logger LOG = Logger.getLogger(VdiStepMigrationPlugin.class);

  private WdkModel _wdkModel;
  private boolean _write;
  private Map<String, String> _legacyIdToVdiId;

  @Override
  public void configure(WdkModel wdkModel, List<String> args) throws Exception {
    _wdkModel = wdkModel;
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
      JSONObject params = step.getParamFilters().getJSONObject("params");
      String legacyId = params.getString("geneListUserDataset");
      String vdiId = _legacyIdToVdiId.get(legacyId);
      params.put("geneListUserDataset", "[\"" + vdiId + "\"]");
      return new RowResult<>(step)
          .setShouldWrite(_write);
    }
    return new RowResult<>(step)
        .setShouldWrite(false);
  }

  @Override
  public void dumpStatistics() {
    // no statistics collected
  }
}
