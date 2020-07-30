package org.eupathdb.common.model.report.summaryview;

import org.gusdb.fgputil.SortDirection;
import org.gusdb.fgputil.SortDirectionSpec;
import org.gusdb.fgputil.json.JsonWriter;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.answer.AnswerValue;
import org.gusdb.wdk.model.question.Question;
import org.gusdb.wdk.model.record.attribute.AttributeField;
import org.gusdb.wdk.model.report.Reporter;
import org.gusdb.wdk.model.report.ReporterConfigException;
import org.gusdb.wdk.model.report.ReporterConfigException.ErrorType;
import org.gusdb.wdk.model.report.config.AnswerDetails;
import org.gusdb.wdk.model.report.config.AnswerDetailsFactory;
import org.gusdb.wdk.model.report.reporter.DefaultJsonReporter;
import org.json.JSONObject;

public class BlastViewReporter extends DefaultJsonReporter {
  
  public static final String ATTR_HEADER = "blastHeader";
  public static final String ATTR_MIDDLE = "blastMiddle";
  public static final String ATTR_FOOTER = "blastFooter";

  public static final String MACRO_SUMMARY = "__WSF_BLAST_SUMMARY__";
  public static final String MACRO_ALIGNMENT = "__WSF_BLAST_ALIGNMENT__";

  public static final String BLAST_META = "blastMeta";

  public static final String SCORE_ATTRIBUTE_NAME = "score";

  public BlastViewReporter(AnswerValue answerValue) {
    super(answerValue);
  }

  @Override
  public Reporter configure(JSONObject config) throws ReporterConfigException, WdkModelException {
    Question question = _baseAnswer.getAnswerSpec().getQuestion();
    String questionName = question.getName();
    if (!(questionName.contains("Similarity") || questionName.contains("Blast"))) {
      throw new ReporterConfigException("Only BLAST searches can use this report", ErrorType.DATA_VALIDATION);
    }
    // explicitly sort by score (desc) in case caller does not
    AttributeField scoreAttr = question.getAttributeField(SCORE_ATTRIBUTE_NAME)
        .orElseThrow(() -> new WdkModelException("BLAST question " +
            question.getFullName() + " does not contain score attribute."));
    AnswerDetails details = AnswerDetailsFactory.createFromJson(config, _baseAnswer.getAnswerSpec().getQuestion());
    details.getSorting().add(0, new SortDirectionSpec<AttributeField>(scoreAttr, SortDirection.DESC));
    return configure(details);
  }

  @Override
  public JsonWriter writeAdditionalJson(JsonWriter writer) throws WdkModelException { 
    JSONObject json = new JSONObject();
    String message = _baseAnswer.getResultMessage().orElse("");
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
