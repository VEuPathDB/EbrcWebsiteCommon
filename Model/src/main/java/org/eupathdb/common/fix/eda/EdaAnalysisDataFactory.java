package org.eupathdb.common.fix.eda;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.gusdb.fgputil.ListBuilder;
import org.gusdb.fgputil.db.platform.DBPlatform;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowFactory;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowWriter;
import org.json.JSONObject;

/**
 * Contains read/write SQL to update the edauserXX.analysis table rows
 * 
 * @author rdoherty
 */
public class EdaAnalysisDataFactory implements TableRowFactory<EdaAnalysisRow>, TableRowWriter<EdaAnalysisRow> {

  /* This class contains the ID and mutable data of a row in the following table

  CREATE TABLE "EDAUSERMB"."ANALYSIS" (
   "ANALYSIS_ID" VARCHAR2(50 BYTE) NOT NULL ENABLE, 
     "USER_ID" NUMBER(*,0) NOT NULL ENABLE, 
   "STUDY_ID" VARCHAR2(50 BYTE) NOT NULL ENABLE, 
     "STUDY_VERSION" VARCHAR2(50 BYTE), 
     "API_VERSION" VARCHAR2(50 BYTE), 
     "DISPLAY_NAME" VARCHAR2(50 BYTE) NOT NULL ENABLE, 
     "DESCRIPTION" VARCHAR2(4000 BYTE), 
     "CREATION_TIME" TIMESTAMP (6) NOT NULL ENABLE, 
     "MODIFICATION_TIME" TIMESTAMP (6) NOT NULL ENABLE, 
     "IS_PUBLIC" NUMBER(*,0) NOT NULL ENABLE, 
   "NUM_FILTERS" NUMBER(*,0) NOT NULL ENABLE, 
   "NUM_COMPUTATIONS" NUMBER(*,0) NOT NULL ENABLE, 
   "NUM_VISUALIZATIONS" NUMBER(*,0) NOT NULL ENABLE, 
   "ANALYSIS_DESCRIPTOR" CLOB, 
     "NOTES" CLOB, 
     "PROVENANCE" CLOB, 
      PRIMARY KEY ("ANALYSIS_ID")
  */

  private static final String ANALYSIS_TABLE = "analysis";

  private static final String COL_ANALYSIS_ID = "analysis_id";
  private static final String COL_STUDY_ID = "study_id";
  private static final String COL_ANALYSIS_DESCRIPTOR = "analysis_descriptor";
  private static final String COL_NUM_FILTERS = "num_filters";
  private static final String COL_NUM_COMPUTATIONS = "num_computations";
  private static final String COL_NUM_VISUALIZATIONS = "num_visualizations";

  private static final String[] MUTABLE_COLUMNS = new String[] {
      COL_STUDY_ID,
      COL_ANALYSIS_DESCRIPTOR,
      COL_NUM_FILTERS,
      COL_NUM_COMPUTATIONS,
      COL_NUM_VISUALIZATIONS
  };

  private final String _schema;

  public EdaAnalysisDataFactory(String schema) {
    _schema = schema;
  }

  @Override
  public void setUp(WdkModel wdkModel) throws Exception {
    // nothing to do here
  }

  @Override
  public void tearDown(WdkModel wdkModel) throws Exception {
    // nothing to do here
  }

  @Override
  public String getRecordsSql(String schema, String projectId) {
    return "select " + COL_ANALYSIS_ID + ", " + String.join(", ", MUTABLE_COLUMNS) + " from " + _schema + ANALYSIS_TABLE;
  }

  @Override
  public EdaAnalysisRow newTableRow(ResultSet rs, DBPlatform platform) throws SQLException {
    return new EdaAnalysisRow(
        rs.getString(COL_ANALYSIS_ID),
        rs.getString(COL_STUDY_ID),
        new JSONObject(platform.getClobData(rs, COL_ANALYSIS_DESCRIPTOR)),
        rs.getInt(COL_NUM_FILTERS),
        rs.getInt(COL_NUM_COMPUTATIONS),
        rs.getInt(COL_NUM_VISUALIZATIONS)
    );
  }

  @Override
  public List<String> getTableNamesForBackup(String schema) {
    return List.of(_schema + ANALYSIS_TABLE);
  }

  @Override
  public String getWriteSql(String schema) {
    // use passed schema instead of the one on in model-config since EDA
    //   uses different user schemas for user data (not e.g. userlogins5 like WDK)
    return "update " + _schema + ANALYSIS_TABLE +
        " set " + Arrays.stream(MUTABLE_COLUMNS)
          .map(col -> col + " = ?")
          .collect(Collectors.joining(", ")) +
        " where " + COL_ANALYSIS_ID + " = ?";
  }

  private static final Integer[] UPDATE_COLUMN_TYPES = new Integer[] {
      Types.VARCHAR, // study_id
      Types.CLOB,    // analysis_descriptor
      Types.INTEGER, // num_filters
      Types.INTEGER, // num_computations
      Types.INTEGER, // num_visualizations
      Types.VARCHAR  // analysis_id (where clause)
  };

  @Override
  public Integer[] getParameterTypes() {
    return UPDATE_COLUMN_TYPES;
  }

  @Override
  public List<Object[]> toValues(EdaAnalysisRow row) {
    return ListBuilder.asList(new Object[] {
        row.getStudyId(),
        row.getDescriptor().toString(),
        row.getNumFilters(),
        row.getNumComputations(),
        row.getNumVisualizations(),
        row.getAnalysisId()
    });
  }

}
