package org.eupathdb.common.model.report.summaryview;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import javax.sql.DataSource;

import org.gusdb.fgputil.FormatUtil;
import org.gusdb.fgputil.SortDirection;
import org.gusdb.fgputil.SortDirectionSpec;
import org.gusdb.fgputil.db.SqlUtils;
import org.gusdb.fgputil.db.runner.SQLRunner;
import org.gusdb.fgputil.db.runner.SQLRunnerException;
import org.gusdb.fgputil.json.JsonUtil;
import org.gusdb.wdk.core.api.JsonKeys;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkUserException;
import org.gusdb.wdk.model.answer.AnswerValue;
import org.gusdb.wdk.model.answer.stream.SingleAttributeRecordStream;
import org.gusdb.wdk.model.question.Question;
import org.gusdb.wdk.model.record.PrimaryKeyValue;
import org.gusdb.wdk.model.record.RecordClass;
import org.gusdb.wdk.model.record.RecordInstance;
import org.gusdb.wdk.model.record.StaticRecordInstance;
import org.gusdb.wdk.model.record.attribute.AttributeField;
import org.gusdb.wdk.model.report.Reporter;
import org.gusdb.wdk.model.report.ReporterConfigException;
import org.gusdb.wdk.model.report.ReporterConfigException.ErrorType;
import org.gusdb.wdk.model.report.config.AnswerDetails;
import org.gusdb.wdk.model.report.config.AnswerDetailsFactory;
import org.gusdb.wdk.model.report.reporter.DefaultJsonReporter;
import org.gusdb.wdk.model.report.util.RecordFormatter;
import org.json.JSONArray;
import org.json.JSONObject;

public class BlastViewReporter extends DefaultJsonReporter {

  public static final String ATTR_HEADER = "blastHeader";
  public static final String ATTR_MIDDLE = "blastMiddle";
  public static final String ATTR_FOOTER = "blastFooter";

  private static final String SUMMARY_ATTRIBUTE = "summary";
  private static final String ALIGNMENT_ATTRIBUTE = "alignment";

  private static final Set<String> REQUIRED_ATTRIBUTES = new HashSet<>(
      Arrays.asList(SUMMARY_ATTRIBUTE, ALIGNMENT_ATTRIBUTE));

  public static final String MACRO_SUMMARY = "__WSF_BLAST_SUMMARY__";
  public static final String MACRO_ALIGNMENT = "__WSF_BLAST_ALIGNMENT__";

  private static final String ALIGNMENT_JSON_MACRO = "$$$$$ALIGNMENT$$$$$";

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
      throw new ReporterConfigException("Only BLAST searches can use this report.  Question: " + questionName, ErrorType.DATA_VALIDATION);
    }
    // explicitly sort by score (desc) in case caller does not
    AttributeField scoreAttr = question.getAttributeField(SCORE_ATTRIBUTE_NAME)
        .orElseThrow(() -> new WdkModelException("BLAST question " +
            question.getFullName() + " does not contain score attribute."));
    AnswerDetails details = AnswerDetailsFactory.createFromJson(config, _baseAnswer.getAnswerSpec().getQuestion());
    details.getSorting().add(0, new SortDirectionSpec<AttributeField>(scoreAttr, SortDirection.DESC));

    // validate that only summary and alignment attributes are requested
    if (!REQUIRED_ATTRIBUTES.equals(details.getAttributes().keySet())) {
      throw new ReporterConfigException("BLAST view reporter clients must " +
          "request exactly these attributes: " + FormatUtil.join(REQUIRED_ATTRIBUTES, ", "));
    }

    return configure(details);
  }

  @Override
  protected void write(OutputStream out) throws WdkModelException {

    // record formatter requires the ID attribute, so must add to stream request
    //   if not already present and it contains non-PK columns
    RecordClass recordClass = _baseAnswer.getAnswerSpec().getQuestion().getRecordClass();
    AttributeField idField = recordClass.getIdAttributeField();
    if (!_attributes.containsKey(idField.getName()) && recordClass.idAttributeHasNonPkMacros()) {
      throw new WdkModelException("Blast reporter cannot be used with recordclasses that have non-PK fields in their idAttribute.");
    }

    // NOTE: The attribute stream will never be opened (i.e. record iterator will never be instantiated)
    //       We only create it to get the SQL inside, but auto-closing is good practice anyway and makes IDEs happy
    try (SingleAttributeRecordStream recordStream = new SingleAttributeRecordStream(_baseAnswer, _attributes.values());
         BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(out))) {

      // start parent object and records array
      writer.write("{\"" + JsonKeys.RECORDS + "\":[");

      DataSource appDb = _baseAnswer.getWdkModel().getAppDb().getDataSource();
      int numRecordsReturned = new SQLRunner(appDb, recordStream.getSql(), "blast-result").executeQuery(rs -> {
        try {
          int recordCount = 0;
          // first record
          if (rs.next()) {
            recordCount++;
            writeRecordJson(writer, rs, recordClass);
          }
          while (rs.next()) {
            recordCount++;
            writer.write(",");
            writeRecordJson(writer, rs, recordClass);
          }
          return recordCount;
        }
        catch (WdkModelException | WdkUserException | IOException e) {
          throw new SQLRunnerException(e);
        }
      });

      // get metadata object
      JSONObject metadata = getMetaData(_baseAnswer, _attributes.keySet(), _tables.keySet(), numRecordsReturned);

      // end records array, write meta property
      writer.write("],\"" + JsonKeys.META + "\":" + metadata.toString());

      // write blast-specific metadata, then end the object
      writer.write(",\"" + BLAST_META + "\":" + getBlastMetaJson() + "}");

      writer.flush();

    }
    catch (SQLRunnerException e) {
      WdkModelException.unwrap(e);
    }
    catch (IOException e) {
      throw new WdkModelException(e);
    }
  }

  private void writeRecordJson(BufferedWriter writer, ResultSet rs, RecordClass recordClass)
      throws IOException, WdkModelException, WdkUserException, SQLException {
    // read the primary key from this row
    PrimaryKeyValue pkVal = recordClass.getPrimaryKeyDefinition().getPrimaryKeyFromResultSet(rs);
    RecordInstance record = new StaticRecordInstance(_baseAnswer.getUser(), recordClass, recordClass, pkVal.getRawValues(), false);
    String recordJson = new JSONObject()
        .put(JsonKeys.DISPLAY_NAME, record.getIdAttributeValue().getDisplay())
        .put(JsonKeys.ID, RecordFormatter.getRecordPrimaryKeyJson(record))
        .put(JsonKeys.RECORD_CLASS_NAME, record.getRecordClass().getFullName())
        .put(JsonKeys.ATTRIBUTES, new JSONObject()
            .put(SUMMARY_ATTRIBUTE, rs.getString(SUMMARY_ATTRIBUTE))
            .put(ALIGNMENT_ATTRIBUTE, ALIGNMENT_JSON_MACRO))
        .put(JsonKeys.TABLES, new JSONObject())
        .put(JsonKeys.TABLE_ERRORS, new JSONArray())
        .toString();

    // figure out where the CLOB should be written
    int endOfFirstPart = recordJson.indexOf(ALIGNMENT_JSON_MACRO);
    int beginningOfSecondPart = endOfFirstPart + ALIGNMENT_JSON_MACRO.length();

    // write the first part
    writer.write(recordJson.substring(0, endOfFirstPart));

    // stream the sequence clob
    SqlUtils.writeClob(rs, ALIGNMENT_ATTRIBUTE, writer, JsonUtil.CHARACTER_ESCAPER);

    // write the second part
    writer.write(recordJson.substring(beginningOfSecondPart));
  }

  private JSONObject getBlastMetaJson() throws WdkModelException { 
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
    return json;
  }
}
