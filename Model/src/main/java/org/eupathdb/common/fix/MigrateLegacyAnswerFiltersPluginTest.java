package org.eupathdb.common.fix;

import static org.gusdb.fgputil.FormatUtil.NL;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.Tuples.TwoTuple;
import org.gusdb.fgputil.db.runner.SQLRunner;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.gusdb.wdk.model.fix.table.steps.StepData;
import org.json.JSONObject;

public class MigrateLegacyAnswerFiltersPluginTest {

  private static final Logger LOG = Logger.getLogger(MigrateLegacyAnswerFiltersPluginTest.class);

  private static final String GUS_HOME = "/Users/rdoherty/work/gus_home";
  private static final String PROJECT_ID = "PlasmoDB";

  private static class TestCase {

    private final StepData _originalRow;
    private final int _affectedRowCount;

    TestCase(String legacyAnswerFilter, JSONObject paramsAndFilters, int affectedRowCount) {
      _originalRow = new StepData();
      _originalRow.setLegacyAnswerFilter(legacyAnswerFilter);
      _originalRow.setParamFilters(paramsAndFilters);
      _affectedRowCount = affectedRowCount;
    }

    public StepData getInputRow() {
      return _originalRow;
    }

    public int getAffectedRowCount() {
      return _affectedRowCount;
    }
  }

  private static class FilterCase extends TwoTuple<String,Integer> {
    public FilterCase(String name, int stepCount) {
      super(name, stepCount);
    }
    public int getStepCount() {
      return getSecond();
    }
    @Override
    public String toString() {
      return getSecond() + " " + getFirst();
    }
  }

  public static void main(String[] args) throws Exception {
    try (WdkModel wdkModel = WdkModel.construct(PROJECT_ID, GUS_HOME)) {
      LOG.info("**************************************************************" + NL);
      MigrateLegacyAnswerFiltersPlugin plugin = new MigrateLegacyAnswerFiltersPlugin();
      plugin.configure(wdkModel, Collections.emptyList());
      plugin.getTableRowUpdater(wdkModel); // in case there's any additional config
      int totalCases = 0, totalRows = 0, convertedCases = 0, convertedRows = 0, unconvertedCases = 0, unconvertedRows = 0;
      List<FilterCase> unconvertedCaseList = new ArrayList<>();
      for (TestCase test : buildTestCases(wdkModel)) {
        RowResult<StepData> result = plugin.processRecord(test.getInputRow());
        LOG.debug("Case " + test.getInputRow().getLegacyAnswerFilter() + " (" +
            test.getAffectedRowCount() + " rows), write=" + result.shouldWrite() +
            ", new JSON = " + result.getRow().getParamFilters().toString());
        totalCases++;
        totalRows += test.getAffectedRowCount();
        if (result.getRow().getParamFilters().length() != 0) {
          convertedCases++;
          convertedRows += test.getAffectedRowCount();
        }
        else {
          unconvertedCases++;
          unconvertedRows += test.getAffectedRowCount();
          unconvertedCaseList.add(new FilterCase(test.getInputRow().getLegacyAnswerFilter(), test.getAffectedRowCount()));
        }
        //test.isCorrectResult(result.getRow());
      }
      LOG.info("total cases:       " + totalCases + " (" + totalRows + " rows)");
      LOG.info("converted cases:   " + convertedCases + " (" + convertedRows + " rows)");
      LOG.info("unconverted cases: " + unconvertedCases + " (" + unconvertedRows + " rows)");
      LOG.info("**************************************************************" + NL);
      unconvertedCaseList.sort((o1, o2) -> o2.getStepCount() - o1.getStepCount());
      LOG.info("Unconverted cases: " + NL + unconvertedCaseList.stream()
          .filter(c -> c.getStepCount() >= 20)
          .map(c -> c.toString())
          .collect(Collectors.joining(NL))+ NL);
    }
  }

  private static TestCase[] buildTestCases(WdkModel wdkModel) throws WdkModelException {
    try {
      MLAFRowSelector caseFactory = new MLAFRowSelector();
      String sql =
          "select answer_filter, count(answer_filter) as num " +
          caseFactory.getMiddleSql("userlogins5.") +
          " group by answer_filter" +
          " order by answer_filter";
      return new SQLRunner(wdkModel.getUserDb().getDataSource(), sql).executeQuery(rs -> {
        List<TestCase> cases = new ArrayList<>();
        while (rs.next()) {
          String answerFilter = rs.getString("answer_filter");
          if (!rs.wasNull()) {
            cases.add(new TestCase(answerFilter, new JSONObject(), rs.getInt("num")));
          }
        }
        return cases.toArray(new TestCase[0]);
      });
    }
    catch (Exception e) {
      return WdkModelException.unwrap(e);
    }
  }
}
