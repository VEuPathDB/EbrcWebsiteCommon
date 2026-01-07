package org.eupathdb.common.fix;

import static org.gusdb.fgputil.FormatUtil.NL;
import static org.gusdb.fgputil.FormatUtil.getStackTrace;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.gusdb.fgputil.db.SqlUtils;
import org.gusdb.fgputil.db.platform.SupportedPlatform;
import org.gusdb.fgputil.db.pool.ConnectionPoolConfig;
import org.gusdb.fgputil.db.pool.DatabaseInstance;
import org.gusdb.fgputil.db.pool.SimpleDbConfig;
import org.gusdb.fgputil.db.runner.SQLRunner;
import org.gusdb.fgputil.db.runner.SQLRunnerException;
import org.gusdb.fgputil.db.runner.handler.ResultSetHandler;

public class BasketTransfer {

  public static final boolean WRITE = false;

  public static final String FROM_DB_URI = "jdbc:oracle:oci:@rm9972";
  public static final String TO_DB_URI = "jdbc:oracle:oci:@apicommdevN";
  public static final String LOGIN = "wdkmaint";

  public static final String SELECT_SQL =
      "SELECT BASKET_ID, USER_ID, BASKET_NAME, PROJECT_ID," +
      "       RECORD_CLASS, IS_DEFAULT, CATEGORY_ID, PK_COLUMN_1," +
      "       PK_COLUMN_2, PK_COLUMN_3, PREV_BASKET_ID, MIGRATION_ID" +
      "  FROM wdkuser.user_baskets";

  public static final String SELECT_MERGE_VALUES_SQL_MACRO = "##selection_macro##";

  public static final String MERGE_SQL =
      "MERGE INTO wdkuser.user_baskets dest" +
      "  USING ( " + SELECT_MERGE_VALUES_SQL_MACRO + " ) src" +
      "    ON( dest.basket_id = src.basket_id )" +
      "  WHEN MATCHED THEN" +
      "    UPDATE SET basket_id = src.basket_id" + // no-op if matched
      "  WHEN NOT MATCHED THEN" +
      "    INSERT( BASKET_ID, USER_ID, BASKET_NAME, PROJECT_ID," +
      "            RECORD_CLASS, IS_DEFAULT, CATEGORY_ID, PK_COLUMN_1," +
      "            PK_COLUMN_2, PK_COLUMN_3, PREV_BASKET_ID, MIGRATION_ID )"+
      "    VALUES( src.BASKET_ID, src.USER_ID, src.BASKET_NAME, src.PROJECT_ID," +
      "            src.RECORD_CLASS, src.IS_DEFAULT, src.CATEGORY_ID, src.PK_COLUMN_1," +
      "            src.PK_COLUMN_2, src.PK_COLUMN_3, src.PREV_BASKET_ID, src.MIGRATION_ID )";

  public static final int MERGE_BATCH_SIZE = 200;
  public static final int NUM_BATCHES_PER_COMMIT = 5;

  public static void main(String[] args) {
    if (args.length != 1) {
      System.err.println("USAGE: fgpJava " + BasketTransfer.class.getName() + " <wdkmaint_password>");
      System.exit(1);
    }

    String password = args[0];
    try (DatabaseInstance fromDb = new DatabaseInstance(getConfig(FROM_DB_URI, password));
         DatabaseInstance toDb = new DatabaseInstance(getConfig(TO_DB_URI, password))) {
      Connection toDbConnection = null;
      try {
        toDbConnection = toDb.getDataSource().getConnection();
        toDbConnection.setAutoCommit(false);
        new SQLRunner(fromDb.getDataSource(), SELECT_SQL)
          .executeQuery(new BasketTransferrer(toDbConnection));
      }
      finally {
        SqlUtils.closeQuietly(toDbConnection);
      }
      
    }
    catch (Exception e) {
      System.err.println(getStackTrace(e));
      System.exit(2);
    }
  }

  private static class BasketTransferrer implements ResultSetHandler<BasketTransferrer> {

    private final Connection _toDbConnection;

    public BasketTransferrer(Connection toDbConnection) {
      _toDbConnection = toDbConnection;
    }

    @Override
    public BasketTransferrer handleResult(ResultSet rs) throws SQLException {
      List<Object[]> mergeBatch = new ArrayList<>();
      int numBatchesRun = 0;
      int numCommits = 0;
      while (rs.next()) {
        mergeBatch.add(readBasketRow(rs));
        if (mergeBatch.size() >= MERGE_BATCH_SIZE) {
          insertMergeBatch(mergeBatch, _toDbConnection);
          numBatchesRun++;
          mergeBatch.clear();
        }
        if (numBatchesRun >= NUM_BATCHES_PER_COMMIT) {
          numCommits++;
          System.out.println("Committing " + NUM_BATCHES_PER_COMMIT + " batches. Total commits: " + numCommits);
          if (WRITE) _toDbConnection.commit();
          numBatchesRun = 0;
        }
      }
      if (!mergeBatch.isEmpty()) {
        insertMergeBatch(mergeBatch, _toDbConnection);
        numBatchesRun++;
      }
      if (numBatchesRun >= NUM_BATCHES_PER_COMMIT) {
        numCommits++;
        System.out.println("Committing final " + numBatchesRun + " batches. Total commits: " + numCommits);
        if (WRITE) _toDbConnection.commit();
      }
      return this;
    }
  }

  private static void insertMergeBatch(List<Object[]> mergeBatch, Connection connection) {
    
    String sql = MERGE_SQL.replace(SELECT_MERGE_VALUES_SQL_MACRO, getValuesSelect(mergeBatch));
    try {
      System.out.print("Merging batch, ");
      if (WRITE)
        new SQLRunner(connection, sql).executeUpdate();
      else
        System.out.println(sql);
    }
    catch (SQLRunnerException e) {
      System.err.println("Failed to merge set of rows.  Failed SQL:" + NL + sql + NL + getStackTrace(e));
    }
  }

  private static String getValuesSelect(List<Object[]> mergeBatch) {
    StringBuilder selectSql = new StringBuilder();
    for (int i = 0; i < mergeBatch.size(); i++) {
      if (i != 0 ) {
        selectSql.append(" UNION ALL ");
      }
      selectSql.append("SELECT ").append(getTableValues(mergeBatch.get(i))).append(" FROM dual");
    }
    return selectSql.toString();
  }

  /* Basket Table SQL:
   * 
   * "BASKET_ID" NUMBER(12,0) NOT NULL ENABLE, 
   * "USER_ID" NUMBER(12,0) NOT NULL ENABLE, 
   * "BASKET_NAME" VARCHAR2(100 BYTE), 
   * "PROJECT_ID" VARCHAR2(50 BYTE) NOT NULL ENABLE, 
   * "RECORD_CLASS" VARCHAR2(100 BYTE) NOT NULL ENABLE, 
   * "IS_DEFAULT" NUMBER(1,0), 
   * "CATEGORY_ID" NUMBER(12,0), 
   * "PK_COLUMN_1" VARCHAR2(1999 BYTE) NOT NULL ENABLE, 
   * "PK_COLUMN_2" VARCHAR2(1999 BYTE), 
   * "PK_COLUMN_3" VARCHAR2(1999 BYTE), 
   * "PREV_BASKET_ID" NUMBER(12,0), 
   * "MIGRATION_ID" NUMBER(12,0)
   */

  private static String getTableValues(Object[] row) {
    return new StringBuilder()
      .append(row[0]).append("as BASKET_ID, ")
      .append(row[1]).append("as USER_ID, ")
      .append(quoteOrNull(row[2])).append("as BASKET_NAME, ")
      .append("'"+row[3]+"'").append("as PROJECT_ID, ")
      .append("'"+row[4]+"'").append("as RECORD_CLASS, ")
      .append(valueOrNull(row[5])).append("as IS_DEFAULT, ")
      .append(valueOrNull(row[6])).append("as CATEGORY_ID, ")
      .append(quoteOrNull(row[7])).append("as PK_COLUMN_1, ")
      .append(quoteOrNull(row[8])).append("as PK_COLUMN_2, ")
      .append(quoteOrNull(row[9])).append("as PK_COLUMN_3, ")
      .append(valueOrNull(row[10])).append("as PREV_BASKET_ID, ")
      .append(valueOrNull(row[11])).append("as MIGRATION_ID")
      .toString();
  }

  private static String valueOrNull(Object value) {
    return (value == null ? "null" : String.valueOf(value));
  }

  private static String quoteOrNull(Object value) {
    return (value == null ? "null" : "'" +  String.valueOf(value) + "'");
  }

  private static Object[] readBasketRow(ResultSet rs) throws SQLException {
    Object[] row = new Object[12];
    for (int i = 0; i < 12; i++) {
      row[i] = rs.getObject(i + 1);
    }
    return row;
  }

  private static ConnectionPoolConfig getConfig(String dbUri, String password) {
    return SimpleDbConfig.create(SupportedPlatform.ORACLE, dbUri, LOGIN, password);
  }
}
