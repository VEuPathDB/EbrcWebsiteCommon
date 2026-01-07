package org.eupathdb.common.fix;

import static org.gusdb.fgputil.FormatUtil.NL;
import static org.gusdb.fgputil.FormatUtil.TAB;
import static org.gusdb.fgputil.FormatUtil.getStackTrace;
import static org.gusdb.fgputil.FormatUtil.join;

import java.io.PrintWriter;
import java.util.Map;

import javax.sql.DataSource;

import org.gusdb.fgputil.Tuples.TwoTuple;
import org.gusdb.fgputil.db.runner.SQLRunner;
import org.gusdb.fgputil.db.runner.handler.BasicResultSetHandler;
import org.gusdb.fgputil.runtime.GusHome;
import org.gusdb.wdk.model.WdkModel;

public class GuestUserReport {

  private static class LabeledQuery extends TwoTuple<String,String> {
    public LabeledQuery(String label, String sql) { super(label, sql); }
    public String getLabel() { return getFirst(); }
    public String getSql() { return getSecond(); }
  }

  public static final String SCHEMA_MACRO = "$$SCHEMA_MACRO$$";

  private static final String SELECTED_STEPS_SUBQUERY =
      "select *" +
      "  from " + SCHEMA_MACRO + "steps s, " + SCHEMA_MACRO + "users u" +
      "  where s.user_id = u.user_id" +
      "  and u.is_guest = 1" +
      "  and question_name not like '%Internal%'" +
      "  and question_name not like '%SpanLogic%'" +
      "  and question_name not like '%Dump%'" +
      "  and question_name not like '%WeightFilter%'";

  private static final LabeledQuery[] QUERIES = {

    new LabeledQuery("Number of guests per month",
      "select count(*) as amount, month" +
      "  from (" +
      "    select substr(register_time,4,6) as month" +
      "    from " + SCHEMA_MACRO + "users u" +
      "    where u.is_guest = 1" +
      "  )" +
      "  group by month" +
      "  order by amount desc"),

    new LabeledQuery("Number of guest steps per month",
      "select count(*) as amount, month" +
      "  from (" +
      "    select substr(create_time,4,6) as month" +
      "      from ( " + SELECTED_STEPS_SUBQUERY + " )" +
      "  )" +
      "  group by month" +
      "  order by amount desc"),

    new LabeledQuery("Number of guest steps by project",
      "select count(*) as amount, project_id" +
      "  from ( " + SELECTED_STEPS_SUBQUERY + " )" +
      "  group by project_id" +
      "  order by amount desc, project_id"),

    new LabeledQuery("Number of guest steps by question",
      "select count(*) as amount, question_name" +
      "  from ( " + SELECTED_STEPS_SUBQUERY + " )" +
      "  group by question_name" +
      "  order by amount desc, question_name")

  };

  private static final PrintWriter stdout = new PrintWriter(System.out);

  public static void main(String[] args) {
    if (args.length != 2 || !args[0].equals("--primaryModel") || args[1].isEmpty()) {
      System.err.println("USAGE: eupathGuestUserReport --primaryModel <projectId>");
      System.err.println("  primaryModel is used to read UserDB connection info");
      System.exit(1);
    }
    String projectId = args[1];
    stdout.println("Using UserDB from Model: " + projectId);
    try (WdkModel wdkModel = WdkModel.construct(projectId, GusHome.getGusHome())) {
      stdout.println("Connection URL: " + wdkModel.getUserDb().getConfig().getConnectionUrl());
      stdout.println("Connection User: " + wdkModel.getUserDb().getConfig().getLogin());
      DataSource userDb = wdkModel.getUserDb().getDataSource();
      String userSchema = wdkModel.getModelConfig().getUserDB().getUserSchema();
      for (LabeledQuery query : QUERIES) {
        dumpResults(userDb, userSchema, query);
      }
      stdout.close();
    }
    catch (Exception e) {
      System.err.println("Unable to complete report." + NL + getStackTrace(e));
      System.exit(2);
    }
  }

  private static void dumpResults(DataSource userDb, String userSchema, LabeledQuery query) {
    stdout.println(NL + query.getLabel() + NL);
    BasicResultSetHandler handler = new BasicResultSetHandler();
    new SQLRunner(userDb, query.getSql().replace(SCHEMA_MACRO, userSchema)).executeQuery(handler);
    stdout.println(join(handler.getColumnNames().toArray(), TAB));
    for (Map<String,Object> row : handler.getResults()) {
      stdout.println(join(row.values().toArray(), TAB));
    }
  }
}
