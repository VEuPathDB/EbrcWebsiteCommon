package org.eupathdb.common.fix;

import java.sql.Connection;
import java.sql.PreparedStatement;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.db.pool.DatabaseInstance;
import org.gusdb.fgputil.db.runner.SQLRunner;
import org.gusdb.fgputil.runtime.GusHome;
import org.gusdb.wdk.model.config.ModelConfigParser;
import org.gusdb.wdk.model.config.ModelConfigUserDB;

public class FillDatasetValueOrderColumn {

  private static final Logger LOG = Logger.getLogger(FillDatasetValueOrderColumn.class);

  private static final int BATCH_SIZE = 10000;

  public static void main(String[] args) throws Exception {

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

      // read values from temp table and insert
      new SQLRunner(conn, selectSql).executeQuery(rs -> {
        int batchCount = 0;
        long totalRecords = 0;
        while (rs.next()) {
          ps.setLong(1, rs.getLong(1));
          ps.setLong(2, rs.getLong(2));
          ps.addBatch();
          batchCount++;
          if (batchCount >= BATCH_SIZE) {
            ps.executeBatch();
            totalRecords += batchCount;
            batchCount = 0;
            LOG.info("Update count: " + totalRecords);
          }
        }
        if (batchCount > 0) {
          ps.executeBatch();
          totalRecords += batchCount;
          LOG.info("Update count: " + totalRecords);
        }
        return null;
      }, BATCH_SIZE);
    }
  }
}
