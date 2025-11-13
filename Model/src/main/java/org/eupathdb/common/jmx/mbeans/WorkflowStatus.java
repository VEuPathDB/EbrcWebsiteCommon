package org.eupathdb.common.jmx.mbeans;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.db.SqlUtils;
import org.gusdb.wdk.jmx.BeanBase;


/**
 * MBean representing the workflow tables.
 */
public class WorkflowStatus extends BeanBase implements WorkflowStatusMBean {

  private static final Logger logger = Logger.getLogger(WorkflowStatus.class.getName());
  ArrayList<Map<String, String>> workflowStatuses;

  public WorkflowStatus() {
    super();
  }

  @Override
  public ArrayList<Map<String, String>> gettable_statuses() {
    populateWorkflowStat();
    return workflowStatuses;
  }
  
  private String workflowStatusSql() {
    StringBuffer sql = new StringBuffer();

    sql.append("select distinct regexp_substr(name,                              ");
    sql.append("                '[^\\.]*\\.?[^\\.]*') as step                    ");
    sql.append("                , decode(off_line, 0, 'NO', 'YES') as off_line   ");
    sql.append("                , state                                          ");
    sql.append("from apidb.workflowstep where state != 'DONE'                    ");
    sql.append("order by step                                                    ");
    return sql.toString();
  }

  private void populateWorkflowStat() {
    logger.debug("Getting Workflow stats");
    DataSource datasource = getWdkModel().getAppDb().getDataSource();
    workflowStatuses = new ArrayList<Map<String, String>>();

    String sql = workflowStatusSql();
    if (sql == null) return;

    ResultSet rs = null;
    PreparedStatement ps = null;

    try {
      ps = SqlUtils.getPreparedStatement(datasource, sql, SqlUtils.Autocommit.OFF);
      rs = ps.executeQuery();
     while (rs.next()) {
        HashMap<String, String> map = new HashMap<String, String>();
        ResultSetMetaData rsmd = rs.getMetaData();
        int numColumns = rsmd.getColumnCount();
        for (int i=1; i<numColumns+1; i++) {
          String columnName = rsmd.getColumnName(i).toLowerCase();
          map.put(columnName, rs.getString(columnName) );
        }
        workflowStatuses.add(map);
      }
    } catch (SQLException sqle) {
      logger.error(sqle);
    } catch (Exception e) {
        logger.error("NPE ", e);
    } finally {
        SqlUtils.closeResultSetAndStatement(rs, ps);
    } 
  }

}
