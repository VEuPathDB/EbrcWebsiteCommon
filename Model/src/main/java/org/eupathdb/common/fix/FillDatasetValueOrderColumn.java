package org.eupathdb.common.fix;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.Date;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.Timer;
import org.gusdb.fgputil.db.pool.DatabaseInstance;
import org.gusdb.fgputil.db.runner.SQLRunner;
import org.gusdb.fgputil.db.runner.SingleLongResultSetHandler;
import org.gusdb.fgputil.runtime.GusHome;
import org.gusdb.wdk.model.config.ModelConfigParser;
import org.gusdb.wdk.model.config.ModelConfigUserDB;

public class FillDatasetValueOrderColumn {

  private static final Logger LOG = Logger.getLogger(FillDatasetValueOrderColumn.class);

  private static final int BATCH_SIZE = 10000;

  public static void main(String[] args) throws Exception {

    boolean write = args.length == 1 && args[0].equals("-write");

    // parse user db configuration
    ModelConfigParser parser = new ModelConfigParser(GusHome.getGusHome());
    ModelConfigUserDB dbConfig = parser.parseConfig("PlasmoDB").build().getUserDB();
    String schema = dbConfig.getUserSchema();

    // sql for temp table creation
    String createOrderTableSql =
        "create table dsordering as ( " +
        "  select dataset_value_id, row_number() over(partition by dataset_id order by dataset_value_id asc) as dataset_value_order " +
        "  from " + schema + "dataset_values " +
        ")";

    // sql for size of temp table
    String tmpTableCountSql =
        "select count(*) from dsordering";

    // sql for select
    String selectSql =
        "select dataset_value_order, dataset_value_id from dsordering";

    // sql for update
    String updateSql =
        "update " + dbConfig.getUserSchema() + "dataset_values " +
        "set dataset_value_order = ? where dataset_value_id = ?";

    try (DatabaseInstance db = new DatabaseInstance(dbConfig);
         Connection conn = db.getDataSource().getConnection();
         PreparedStatement ps = conn.prepareStatement(updateSql)) {

      // create temp table
      new SQLRunner(conn, createOrderTableSql).executeStatement();

      // get size for metrics reporting
      long expectedRowCount = new SQLRunner(conn, tmpTableCountSql)
          .executeQuery(new SingleLongResultSetHandler()).orElseThrow();

      // read values from temp table and insert
      new SQLRunner(conn, selectSql).executeQuery(rs -> {
        Timer t = new Timer();
        int batchCount = 0;
        long totalRecords = 0;
        while (rs.next()) {
          if (write) {
            ps.setLong(1, rs.getLong(1));
            ps.setLong(2, rs.getLong(2));
            ps.addBatch();
          }
          else {
            LOG.info("Will set order of " + rs.getLong(2) + " to " + rs.getLong(1));
          }
          batchCount++;
          if (batchCount >= BATCH_SIZE) {
            if (write) {
              ps.executeBatch();
            }
            totalRecords += batchCount;
            logProgress(t, totalRecords, expectedRowCount);
            batchCount = 0;
          }
        }
        if (batchCount > 0) {
          if (write) {
            ps.executeBatch();
          }
          totalRecords += batchCount;
          logProgress(t, totalRecords, expectedRowCount);
        }
        return null;
      }, BATCH_SIZE);
    }
  }

  private static void logProgress(Timer t, long totalRecords, long expectedRowCount) {
    long elapsed = t.getElapsed();
    long pctComplete = totalRecords * 100 / expectedRowCount;
    long expectedRemaining = (elapsed * 100 / pctComplete) - elapsed;
    Date eta = new Date(System.currentTimeMillis() + expectedRemaining);
    LOG.info("Num Updated: " + totalRecords + ", " + pctComplete + "% complete, elapsed: " + Timer.getDurationString(elapsed) + ", ETA: " + eta);
  }
}
