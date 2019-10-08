package org.eupathdb.common.model.report;

import static java.util.stream.Collectors.joining;
import static org.gusdb.fgputil.FormatUtil.TAB;
import static org.gusdb.fgputil.functional.Functions.fSwallow;
import static org.gusdb.fgputil.iterator.IteratorUtil.toStream;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;

import org.gusdb.fgputil.json.JsonWriter;
import org.gusdb.wdk.core.api.JsonKeys;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.answer.AnswerValue;
import org.gusdb.wdk.model.answer.stream.RecordStream;
import org.gusdb.wdk.model.answer.stream.RecordStreamFactory;
import org.gusdb.wdk.model.record.RecordInstance;
import org.gusdb.wdk.model.record.TableValue;
import org.gusdb.wdk.model.report.reporter.AnswerDetailsReporter;
import org.json.JSONObject;

/**
 * Provides records returned by the answer value in the following JSON format:
 * [
 *   {
 *     id: ["pk1", "pk2", "pk3"],
 *     tableNameOne: "a clob holding tab delimited table values",
 *     tableNameTwo: "a clob holding tab delimited table values",
 *     attributeNameOne: "attribute value"
 *     etc.
 *   }
 * ]
 * 
 * @author rdoherty
 */
public class SolrLoaderReporter extends AnswerDetailsReporter {

  public SolrLoaderReporter(AnswerValue answerValue) {
    super(answerValue);
  }

  @Override
  protected void write(OutputStream out) throws WdkModelException {

    // create output writer and initialize record stream
    try (JsonWriter writer = new JsonWriter(out);
         RecordStream records = RecordStreamFactory.getRecordStream(
            _baseAnswer, _attributes.values(), _tables.values())) {
      writer.array();
      for (RecordInstance record : records) {
        writer.value(formatRecord(record, _attributes.keySet(), _tables.keySet()));
      }
      writer.endArray();
    }
    catch (IOException e) {
      throw new WdkModelException("Unable to write reporter result to output stream", e);
    }
  }

  private static JSONObject formatRecord(RecordInstance record,
      Set<String> attributeNames, Set<String> tableNames) throws WdkModelException {
    try {
      var obj = new JSONObject()
          .put(JsonKeys.ID, record.getPrimaryKey().getValues().values());
      for (String attributeName: attributeNames) {
        obj.put(attributeName, record.getAttributeValue(attributeName).getValue());
      }
      for (String tableName: tableNames) {
        obj.put(tableName, aggregateTableValue(record.getTableValue(tableName)));
      }
      return obj;
    }
    catch (Exception e) {
      throw WdkModelException.translateFrom(e);
    }
  }

  private static String aggregateTableValue(TableValue table) {
    return toStream(table)
      .map(row -> row.values().stream()
        .map(fSwallow(col -> col.getValue()))
        .collect(joining(TAB)))
      .collect(joining(TAB));
  }
}
