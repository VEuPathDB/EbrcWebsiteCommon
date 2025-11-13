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
 * MBean representing the tuningManager table.
 */
public class TuningManagerStatus extends BeanBase implements TuningManagerStatusMBean {

  private static final Logger logger = Logger.getLogger(TuningManagerStatus.class.getName());
  ArrayList<Map<String, String>> tuningTableStatuses;

  public TuningManagerStatus() {
    super();
  }

  @Override
  public ArrayList<Map<String, String>> gettable_statuses() {
    populateTuningTableStat();
    return tuningTableStatuses;
  }
  
  private String tuningTableStatusSql() {
    StringBuffer sql = new StringBuffer();
    sql.append(" select                                                            ");
    sql.append(" timestamp as created,                                             ");
    sql.append(" status,                                                           ");
    sql.append(" last_check,                                                       ");
    sql.append(" name                                                              ");
    sql.append(" from apidb.TuningTable                                            ");
    sql.append(" order by last_check DESC NULLS LAST, created DESC, status         ");
    return sql.toString();
  }

  private void populateTuningTableStat() {
    logger.debug("Getting tuningTable stats");
    DataSource datasource = getWdkModel().getAppDb().getDataSource();
    tuningTableStatuses = new ArrayList<Map<String, String>>();

    String sql = tuningTableStatusSql();
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
        tuningTableStatuses.add(map);
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
