package org.eupathdb.common.model.report;

import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Collections;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.apache.log4j.Logger;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkUserException;
import org.gusdb.wdk.model.answer.AnswerValue;
import org.gusdb.wdk.model.answer.stream.RecordStream;
import org.gusdb.wdk.model.answer.stream.RecordStreamFactory;
import org.gusdb.wdk.model.record.RecordClass;
import org.gusdb.wdk.model.record.RecordInstance;
import org.gusdb.wdk.model.record.attribute.AttributeField;
import org.gusdb.wdk.model.report.PropertiesProvider;
import org.gusdb.wdk.model.report.Reporter;
import org.gusdb.wdk.model.report.ReporterConfigException;
import org.json.JSONObject;

public class ZippedFilesReporter implements Reporter {

  private static final Logger LOG = Logger.getLogger(ZippedFilesReporter.class);

  private static final String FILE_RECORDCLASS = "FileRecordClasses.FileRecordClass";
  private static final String FILENAME_ATTRIBUTE = "filename";
  private static final String FILEPATH_ATTRIBUTE = "filepath";

  private AnswerValue _answerValue;
  private List<AttributeField> _requiredAttributes;

  @Override
  public Reporter setAnswerValue(AnswerValue answerValue) throws WdkModelException {
    _answerValue = answerValue;
    RecordClass recordClass = answerValue.getQuestion().getRecordClass();
    if (!recordClass.getFullName().equals(FILE_RECORDCLASS)) {
      throw new IllegalStateException("This reporter should only be available for type: " + FILE_RECORDCLASS);
    }
    AttributeField filename = recordClass.getAttributeField(FILENAME_ATTRIBUTE)
        .orElseThrow(() -> new IllegalStateException(FILE_RECORDCLASS + " must contain attribute " + FILENAME_ATTRIBUTE));
    AttributeField filepath = recordClass.getAttributeField(FILEPATH_ATTRIBUTE)
        .orElseThrow(() -> new IllegalStateException(FILE_RECORDCLASS + " must contain attribute " + FILEPATH_ATTRIBUTE));
    _requiredAttributes = List.of(filename, filepath);
    return this;
  }

  @Override
  public void report(OutputStream stream) throws WdkModelException {
    LOG.info("Starting zipped file response");
    String pathPrefix = _answerValue.getWdkModel().getProperties().get("RAWFILESDOWNLOADDIR") + _answerValue.getWdkModel().getProjectId();
    try (ZipOutputStream out = new ZipOutputStream(stream);
         RecordStream fileRecords = RecordStreamFactory.getRecordStream(_answerValue, _requiredAttributes, Collections.emptyList())) {
      for (RecordInstance record : fileRecords) {
        ZipEntry file = new ZipEntry(record.getAttributeValue(FILENAME_ATTRIBUTE).getValue());
        out.putNextEntry(file);
        String absoluteFilePath = pathPrefix + record.getAttributeValue(FILEPATH_ATTRIBUTE).getValue().replace("a/service/raw-files/","");
        LOG.info("Adding file: " + absoluteFilePath);
        try (InputStream in = new BufferedInputStream(new FileInputStream(absoluteFilePath))) {
          in.transferTo(out);
        }
        out.closeEntry();
      }
    }
    catch (IOException | WdkUserException e) {
      throw new WdkModelException("Unable to stream zipped files", e);
    }
  }

  @Override
  public String getHttpContentType() {
    return "application/zip";
  }

  @Override
  public String getDownloadFileName() {
    return "veupathdb-file-download.zip";
  }

  @Override
  public Reporter setProperties(PropertiesProvider properties) throws WdkModelException {
    // no expected properties
    return this;
  }

  @Override
  public Reporter configure(JSONObject config) throws ReporterConfigException, WdkModelException {
    // no configuration needed
    return this;
  }
}
