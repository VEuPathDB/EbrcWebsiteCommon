package org.eupathdb.common.model.report;

import org.gusdb.fgputil.ArrayUtil;
import org.gusdb.wdk.model.answer.AnswerValue;
import org.gusdb.wdk.model.report.reporter.WordCloudAttributeReporter;

public class EbrcWordCloudAttributeReporter extends WordCloudAttributeReporter {

  private static String[] SUPPLEMENTAL_COMMON_WORDS = {
      "off", "cgi", "bin", "groupac", "href", "http", "org", "tmp",
      "chro", "sequencelist", "orthomcl", "orthomclweb"
  };

  public EbrcWordCloudAttributeReporter(AnswerValue answerValue) {
    super(answerValue);
  }

  @Override
  protected String[] getCommonWords() {
    return ArrayUtil.concatenate(COMMON_WORDS, SUPPLEMENTAL_COMMON_WORDS);
  }
}
