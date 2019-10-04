package org.eupathdb.common.model.report;

import static com.google.common.collect.Streams.stream;
import static java.util.stream.Collectors.joining;
import static org.gusdb.fgputil.functional.Functions.fSwallow;

import java.io.IOException;
import java.io.OutputStream;

import org.gusdb.fgputil.json.JsonWriter;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.answer.AnswerValue;
import org.gusdb.wdk.model.answer.stream.RecordStream;
import org.gusdb.wdk.model.answer.stream.RecordStreamFactory;
import org.gusdb.wdk.model.record.RecordInstance;
import org.gusdb.wdk.model.report.reporter.AnswerDetailsReporter;

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
      writer.object();
      for (RecordInstance record : records) {
        writer.key(getKey(record)).value(getValue(record));
      }
      writer.endObject();
    }
    catch (IOException e) {
      throw new WdkModelException("Unable to write reporter result to output stream", e);
    }
  }

  private String getKey(RecordInstance record) {
    return
      "[" +
        record.getPrimaryKey().getValues().values().stream()
          .map(v -> "\"" + v + "\"")
          .collect(joining(",")) +
      "]";
  }

  private String getValue(RecordInstance record) throws WdkModelException {
    try {
      return
        // join all requested attributes
        _attributes.keySet().stream()
          .map(fSwallow(attrName -> record.getAttributeValue(attrName).getValue()))
          .collect(joining(" ")) +
        // add to tables
        " " +
        // join all requested tables
        _tables.keySet().stream()
          .map(fSwallow(tableName -> stream(record.getTableValue(tableName))
            .map(map -> map.values().stream()
              .map(fSwallow(attrVal -> attrVal.getValue()))
              .collect(joining(" ")))
            .collect(joining(" "))))
          .collect(joining(" "));
    }
    catch (RuntimeException e) {
      throw WdkModelException.translateFrom(e);
    }
  }
}
