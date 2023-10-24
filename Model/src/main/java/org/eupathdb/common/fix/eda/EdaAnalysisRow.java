package org.eupathdb.common.fix.eda;

import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRow;
import org.json.JSONObject;

public class EdaAnalysisRow implements TableRow {

  private String _analysisId;
  private String _studyId;
  private JSONObject _descriptor;
  private int _numFilters;
  private int _numComputations;
  private int _numVisualizations;

  public EdaAnalysisRow(String analysisId, String studyId, JSONObject descriptor,
      int numFilters, int numComputations, int numVisualizations) {
    _analysisId = analysisId;
    _studyId = studyId;
    _descriptor = descriptor;
    _numFilters = numFilters;
    _numComputations = numComputations;
    _numVisualizations = numVisualizations;
  }

  @Override
  public String getDisplayId() {
    return _analysisId;
  }

  public String getAnalysisId() {
    return _analysisId;
  }

  public String getStudyId() {
    return _studyId;
  }

  public void setStudyId(String studyId) {
    _studyId = studyId;
  }

  public JSONObject getDescriptor() {
    return _descriptor;
  }

  public void setDescriptor(JSONObject descriptor) {
    _descriptor = descriptor;
  }

  public int getNumFilters() {
    return _numFilters;
  }

  public void setNumFilters(int numFilters) {
    _numFilters = numFilters;
  }

  public int getNumComputations() {
    return _numComputations;
  }

  public void setNumComputations(int numComputations) {
    _numComputations = numComputations;
  }

  public int getNumVisualizations() {
    return _numVisualizations;
  }

  public void setNumVisualizations(int numVisualizations) {
    _numVisualizations = numVisualizations;
  }

}
