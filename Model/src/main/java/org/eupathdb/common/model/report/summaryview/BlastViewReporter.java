package org.eupathdb.common.model.report.summaryview;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.util.Map;

import org.gusdb.fgputil.json.JsonWriter;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkUserException;
import org.gusdb.wdk.model.answer.factory.AnswerValue;
import org.gusdb.wdk.model.report.AbstractReporter;
import org.gusdb.wdk.model.report.Reporter;
import org.gusdb.wdk.model.report.ReporterConfigException;
import org.json.JSONObject;
import org.apache.log4j.Logger;

public class BlastViewReporter extends AbstractReporter {

  @SuppressWarnings("unused")
  private static final Logger LOG = Logger.getLogger(BlastViewReporter.class);

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
    return this;
  }

  @Override
  public Reporter configure(Map<String, String> config) throws ReporterConfigException, WdkModelException {
    throw new UnsupportedOperationException();
  }

  @Override
  protected void write(OutputStream out) throws WdkModelException {

    // create output writer and initialize record stream
    try (JsonWriter writer = new JsonWriter(new BufferedWriter(new OutputStreamWriter(out)))) {
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
      writer.object();
      writer.key(BLAST_META).value(json);
      writer.endObject();
    }
    catch (WdkUserException | IOException e) {
      throw new WdkModelException("Unable to write reporter result to output stream", e);
    }   
  }

  @Override
  public String getHttpContentType() {
    return "application/json";
  }
}
