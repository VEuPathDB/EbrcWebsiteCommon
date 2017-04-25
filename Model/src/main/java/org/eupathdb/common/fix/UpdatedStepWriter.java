package org.eupathdb.common.fix;

import java.sql.Types;
import java.util.Collection;

import javax.sql.DataSource;

import org.gusdb.fgputil.ListBuilder;
import org.gusdb.fgputil.db.pool.DatabaseInstance;
import org.gusdb.fgputil.db.runner.SQLRunner;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowWriter;
import org.gusdb.wdk.model.fix.table.steps.StepData;

public class UpdatedStepWriter implements TableRowWriter<StepData> {

  private static final String UPDATED_STEPS_TABLE_NAME = "WDK_UPDATED_STEPS";

  private static final String CREATE_TABLE_SQL =
      "CREATE TABLE " + UPDATED_STEPS_TABLE_NAME + " ( \"STEP_ID\" NUMBER(12) NOT NULL )";

  private static final String INSERT_STEP_ID_SQL =
      "INSERT INTO " + UPDATED_STEPS_TABLE_NAME + " (STEP_ID) VALUES (?)";

  @Override
  public String getWriteSql(String schema) {
    return INSERT_STEP_ID_SQL;
  }

  @Override
  public Integer[] getParameterTypes() {
    return new Integer[]{ Types.INTEGER };
  }

  @Override
  public Collection<Object[]> toValues(StepData obj) {
    return ListBuilder.asList(new Object[]{ obj.getStepId() });
  }

  @Override
  public void setUp(WdkModel wdkModel) throws Exception {
    // if wdk_updated_steps does not exist, create it
    DatabaseInstance userDb = wdkModel.getUserDb();
    DataSource userDs = userDb.getDataSource();
    if (!userDb.getPlatform().checkTableExists(
        userDs, wdkModel.getUserDb().getDefaultSchema(), UPDATED_STEPS_TABLE_NAME)) {
      new SQLRunner(userDs, CREATE_TABLE_SQL, "create-updated-steps-table").executeStatement();
    }
  }

  @Override
  public void tearDown(WdkModel wdkModel) throws Exception {
    // nothing to do here
  }

}
