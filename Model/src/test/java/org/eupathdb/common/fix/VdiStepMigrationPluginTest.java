package org.eupathdb.common.fix;

import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.fix.table.steps.StepData;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import java.io.File;
import java.util.List;
import java.util.Objects;

public class VdiStepMigrationPluginTest {
  private WdkModel wdkModel;
  private ClassLoader classLoader;

  @Before
  public void setup() {
    classLoader = getClass().getClassLoader();
    wdkModel = Mockito.mock(WdkModel.class);
  }

  @Test
  public void test() throws Exception {
    final File file = new File(Objects.requireNonNull(classLoader.getResource("migration-unit-test-1.json")).getFile());
    VdiStepMigrationPlugin plugin = new VdiStepMigrationPlugin();
    plugin.configure(wdkModel, List.of(file.getAbsolutePath()));
    StepData testRow = new StepData();
    testRow.setQuestionName("GeneQuestions.GenesByRNASeqUserDataset");
    testRow.setParamFilters(constructParamFilters());
    var result = plugin.processRecord(testRow);
    System.out.println(result.getRow().getParamFilters());
  }

  private JSONObject constructParamFilters() {
    return new JSONObject(
        "{\n" +
            "  \"columnFilters\": {},\n" +
            "  \"filters\": [\n" +
            "    {\n" +
            "      \"name\": \"matched_transcript_filter_array\",\n" +
            "      \"disabled\": false,\n" +
            "      \"value\": {\n" +
            "        \"values\": [\n" +
            "          \"Y\"\n" +
            "        ]\n" +
            "      }\n" +
            "    }\n" +
            "  ],\n" +
            "  \"params\": {\n" +
            "    \"regulated_dir\": \"[\\\"up or down regulated\\\"]\",\n" +
            "    \"min_max_avg_comp\": \"[\\\"average1\\\"]\",\n" +
            "    \"protein_coding_only\": \"[\\\"yes\\\"]\",\n" +
            "    \"profileset_generic\": \"[\\\"121\\\"]\",\n" +
            "    \"rna_seq_dataset\": \"[\\\"4033317\\\"]\",\n" +
            "    \"min_max_avg_ref\": \"[\\\"average1\\\"]\",\n" +
            "    \"fold_change\": \"2\",\n" +
            "    \"samples_fc_ref_generic\": \"[\\\"htseq-count on data 45\\\",\\\"htseq-count on data 44\\\",\\\"htseq-count on data 43\\\"]\",\n" +
            "    \"samples_fc_comp_generic\": \"[\\\"htseq-count on data 49\\\",\\\"htseq-count on data 48\\\",\\\"htseq-count on data 47\\\"]\"\n" +
            "  }\n" +
            "}"
    );
  }
}
