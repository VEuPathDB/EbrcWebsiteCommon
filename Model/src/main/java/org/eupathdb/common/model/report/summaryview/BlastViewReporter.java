package org.eupathdb.common.model.report.summaryview;

import org.gusdb.fgputil.json.JsonWriter;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.answer.factory.AnswerValue;
import org.gusdb.wdk.model.report.Reporter;
import org.gusdb.wdk.model.report.ReporterConfigException;
import org.gusdb.wdk.model.report.reporter.DefaultJsonReporter;
import org.json.JSONObject;

public class BlastViewReporter extends DefaultJsonReporter {
  
  public static final String ATTR_HEADER = "blastHeader";
  public static final String ATTR_MIDDLE = "blastMiddle";
  public static final String ATTR_FOOTER = "blastFooter";

  public static final String MACRO_SUMMARY = "__WSF_BLAST_SUMMARY__";
  public static final String MACRO_ALIGNMENT = "__WSF_BLAST_ALIGNMENT__";

  public static final String BLAST_META = "blastMeta";

  public BlastViewReporter(AnswerValue answerValue) {
    super(answerValue);
  }

  @Override
  public Reporter configure(JSONObject config) throws ReporterConfigException, WdkModelException {
    if (!_baseAnswer.getAnswerSpec().getQuestion().getName().matches("GenesBySimilarity") ) 
      throw new ReporterConfigException("Only BLAST searches can use this report");
    return super.configure(config);
  }

  @Override
  public JsonWriter writeAdditionalJson(JsonWriter writer) { 
    
    JSONObject json = new JSONObject();
    String message = _baseAnswer.getResultMessage();
    String[] pieces = message.split(MACRO_SUMMARY, 2);
    json.put(ATTR_HEADER, pieces[0]);
    if (pieces.length > 1) {
      pieces = pieces[1].split(MACRO_ALIGNMENT, 2);
      json.put(ATTR_MIDDLE, pieces[0]);
      if (pieces.length > 1)
        json.put(ATTR_FOOTER, pieces[1]);
    }
    writer.key(BLAST_META).value(json);
    return writer; 
  }

}
