/**
 * 
 */
package org.apidb.apicommon.model.report;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.apache.log4j.Logger;
import org.gusdb.wdk.model.Utilities;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkUserException;
import org.gusdb.wdk.model.dbms.DBPlatform;
import org.gusdb.wdk.model.dbms.SqlUtils;
import org.gusdb.wdk.model.query.SqlQuery;
import org.gusdb.wdk.model.record.FieldScope;
import org.gusdb.wdk.model.record.RecordClass;
import org.gusdb.wdk.model.record.TableField;
import org.gusdb.wdk.model.record.attribute.AttributeField;
import org.gusdb.wdk.model.record.attribute.ColumnAttributeField;
import org.gusdb.wdk.model.record.attribute.LinkAttributeField;
import org.gusdb.wdk.model.record.attribute.PrimaryKeyAttributeField;
import org.gusdb.wdk.model.record.attribute.TextAttributeField;
import org.gusdb.wsf.util.BaseCLI;

/**
 * @author xingao, steve fischer
 * 
 *         this command generates the data into detail table.
 * 
 */
public class DetailTableLoader extends BaseCLI {

    private static final String ARG_PROJECT_ID = "model";
    private static final String ARG_SQL_FILE = "sqlFile";
    private static final String ARG_RECORD = "record";
    private static final String ARG_TABLE_FIELD = "field";
    private static final String ARG_DETAIL_TABLE = "detailTable";

    private static final String COLUMN_FIELD_NAME = "field_name";
    //private static final String COLUMN_FIELD_TITLE = "field_title";
    //private static final String COLUMN_CONTENT = "content";
    //private static final String COLUMN_ROW_COUNT = "row_count";

    //private static final String FUNCTION_CHAR_CLOB_AGG = "apidb.char_clob_agg";
    //private static final String FUNCTION_CLOB_CLOB_AGG = "apidb.clob_clob_agg";

    private static final String PROP_EXCLUDE_FROM_DUMPER = "excludeFromDumper";

    private static final Logger logger = Logger
            .getLogger(DetailTableLoader.class);

    /**
     * @param args
     * @throws Exception
     */
    public static void main(String[] args) throws Exception {
        String cmdName = System.getProperty("cmdName");
        if (cmdName == null) cmdName = DetailTableLoader.class.getName();
        DetailTableLoader creator = new DetailTableLoader(cmdName,
                "Load a Detail table.  Delete rows that will be replaced");
        try {
            creator.invoke(args);
        }
        finally {
            System.exit(0);
        }
    }

    private WdkModel wdkModel;
    private DataSource queryDataSource;
    private String detailTable;

    /**
     * @param command
     * @param description
     */
    protected DetailTableLoader(String command, String description) {
        super(command, description);
    }

    protected void declareOptions() {
        addSingleValueOption(ARG_PROJECT_ID, true, null, "The ProjectId, which"
                + " should match the directory name under $GUS_HOME, where "
                + "model-config.xml is stored.");

        addSingleValueOption(ARG_SQL_FILE, true, null, "The file that contains"
                + " a sql that returns the primary key columns of the records");

        addSingleValueOption(ARG_RECORD, true, null, "The full name of the "
                + "record class to be dumped.");

        addSingleValueOption(ARG_DETAIL_TABLE, true, null, "The name of the "
                + "detail table where the cached results are stored.");

        addSingleValueOption(ARG_TABLE_FIELD, false, null, "Optional. A comma"
                + " separated list of the name(s) of the table field(s) to be"
                + " dumped.");
    }

    /*
     * (non-Javadoc)
     * 
     * @see org.gusdb.wsf.util.BaseCLI#invoke()
     */
    @Override
    public void execute() throws Exception {
        long start = System.currentTimeMillis();

        String projectId = (String) getOptionValue(ARG_PROJECT_ID);
        String sqlFile = (String) getOptionValue(ARG_SQL_FILE);
        String recordClassName = (String) getOptionValue(ARG_RECORD);
        detailTable = (String) getOptionValue(ARG_DETAIL_TABLE);
        String fieldNames = (String) getOptionValue(ARG_TABLE_FIELD);

        String gusHome = System.getProperty(Utilities.SYSTEM_PROPERTY_GUS_HOME);
        logger.debug("loading model...");
        wdkModel = WdkModel.construct(projectId, gusHome);
        queryDataSource = wdkModel.getQueryPlatform().getDataSource();

        logger.debug("loading id sql...");
        String idSql = loadIdSql(sqlFile);

        logger.debug("getting tables...");
        RecordClass recordClass = wdkModel.getRecordClass(recordClassName);
        Map<String, TableField> tables = recordClass.getTableFieldMap();
        if (fieldNames != null) { // dump individual table
            // all tables are available in this context
            String[] names = fieldNames.split(",");
            for (String fieldName : names) {
                fieldName = fieldName.trim();
                TableField table = tables.get(fieldName);
                if (table == null)
                    throw new WdkModelException(
                            "The table field doesn't exist: " + fieldName);
                dumpTable(table, idSql);
            }
        } else { // no table specified, only dump tables with a specific flag
            for (TableField table : tables.values()) {
                String[] props = table
                        .getPropertyList(PROP_EXCLUDE_FROM_DUMPER);
                if (props.length > 0 && props[0].equalsIgnoreCase("true"))
                    continue;
                dumpTable(table, idSql);
            }
        }

        long end = System.currentTimeMillis();
        logger.info("Total time: " + ((end - start) / 1000.0) + " seconds");
    }

    private String loadIdSql(String sqlFile) throws IOException {
        File file = new File(sqlFile);
        StringBuffer sql = new StringBuffer();
        BufferedReader reader = new BufferedReader(new FileReader(file));
        String line;
        while ((line = reader.readLine()) != null) {
            sql.append(line).append("\n");
        }
        reader.close();
        String idSql = sql.toString().trim();
        if (idSql.endsWith(";"))
            idSql = idSql.substring(0, idSql.length() - 1);
        return idSql.trim();
    }

    /**
     * for a given table, it will generate a SQL by joining the original table
     * query with the input idSql, and collapse rows of one record into a clob.
     * 
     * @param table
     * @param idSql
     * @throws WdkModelException
     * @throws SQLException
     * @throws WdkUserException
     */
    private void dumpTable(TableField table, String idSql)
            throws WdkModelException, SQLException, WdkUserException {
        logger.debug("Dumping table [" + table.getName() + "]...");
        long start = System.currentTimeMillis();

        // first check if the table has any columns
        if (table.getAttributeFields(FieldScope.REPORT_MAKER).length == 0) {
            logger.info("table [" + table.getName()
                    + "] doesn't have any columns to be dumped. skipped.");
            return;
        }

        logger.debug("getting data source...");
        DataSource updateDataSource = wdkModel.getQueryPlatform()
                .getDataSource();
        logger.debug("getting connection...");
        Connection updateConnection = updateDataSource.getConnection();
        logger.debug("Connection obtained...");

        String[] pkColumns = table.getRecordClass()
                .getPrimaryKeyAttributeField().getColumnRefs();
	String pkNames;
	String pkBind;

	// So far (November 2012) WDK data types all have one- or two-column primary key.
        switch (pkColumns.length) {
	case 1: pkNames = pkColumns[0]; pkBind = "?"; break;
	case 2: pkNames = pkColumns[0] + ", " + pkColumns[1]; pkBind = "?,?"; break;
	default: throw new WdkModelException("DetailTableLoader assumes that a primary key comprises no more than 2 columns");
	}

        String insertSql = "insert into " + detailTable + " (" + pkNames
                + ", field_name, field_title, row_count, content, "
                + " modification_date) values(" + pkBind + ",?,?,?,?,?)";
        try {
            logger.debug("disabling auto commit...");
            updateConnection.setAutoCommit(false);
            logger.debug("deleting old result...");
            deleteRows(idSql, pkNames, table.getName(), updateConnection);

            PreparedStatement insertStmt = updateConnection
                    .prepareStatement(insertSql);
            logger.info("Dumping table [" + table.getName() + "]");
            logger.debug("aggregating data...");
            int[] counts = aggregateLocally(table, idSql, insertStmt,
                    insertSql, pkColumns);
            long startCommit = System.currentTimeMillis();
            updateConnection.commit();
            long end = System.currentTimeMillis();

            logger.info("Dump table [" + table.getName()
                    + "] done.  Created and inserted " + counts[0] + " ("
                    + counts[1] + " detail) rows in "
                    + ((end - start) / 1000.0)
                    + " seconds.  Cumulative insert time was "
                    + (int) (counts[2] / 1000) + " seconds.  Commit was "
                    + (int) (end - startCommit) / 1000);
        }
        catch (SQLException ex) {
            updateConnection.rollback();
            throw ex;
        }
        finally {
            if (updateConnection != null) {
                updateConnection.setAutoCommit(true);
                updateConnection.close();
            }
        }
    }

    private void deleteRows(String idSql, String pkNames, String fieldName,
            Connection connection) throws WdkUserException, WdkModelException,
            SQLException {
        long start = System.currentTimeMillis();
        StringBuilder sql = new StringBuilder("DELETE FROM " + detailTable);
        sql.append(" WHERE (" + pkNames + ") IN (" + idSql + ")");
        sql.append(" AND " + COLUMN_FIELD_NAME + "= '" + fieldName + "'");
        logger.info("Removing previous rows [" + fieldName + "]");
        logger.debug("\n" + sql);
        SqlUtils.executeUpdate(wdkModel, connection, sql.toString(),
                  fieldName+"__api-report-detail-delete");
        long end = System.currentTimeMillis();
        logger.info("Deleted rows for [" + fieldName + "] in "
                + ((end - start) / 1000.0) + " seconds");
    }

    private int[] aggregateLocally(TableField table, String idSql,
            PreparedStatement insertStmt, String insertSql, String[] pkColumns)
            throws WdkModelException, SQLException, WdkUserException {

        String title = getTableTitle(table);

        String wrappedSql = getWrappedSql(table, idSql, pkColumns);

        logger.debug("wrapped sql:\n" + wrappedSql);
        ResultSet resultSet = SqlUtils.executeQuery(wdkModel, queryDataSource,
                wrappedSql,  table.getQuery().getFullName() + "__api-report-detail-aggregate",
                2000);
        String pk0 = "";
        String pk1 = "";
        String prevPk0 = "";
        String prevPk1 = "";
        StringBuilder aggregatedContent = new StringBuilder();
        int insertCount = 0;
        int detailCount = 0;
        int rowCount = 0;
        boolean first = true;
        long insertTime = 0;
        while (resultSet.next()) {
            pk0 = resultSet.getString(pkColumns[0]);
	    if (pkColumns.length > 1) {
		pk1 = resultSet.getString(pkColumns[1]);
	    }
            if (!first && (!pk0.equals(prevPk0) || !pk1.equals(prevPk1))) {
                insertTime += insertDetailRow(insertStmt, insertSql, aggregatedContent,
					      rowCount, table, prevPk0, prevPk1,
					      title, pkColumns.length);
                insertCount++;
                aggregatedContent = new StringBuilder();
                rowCount = 0;
            }
            first = false;
            prevPk0 = pk0;
            prevPk1 = pk1;

            // aggregate the columns of one row
            String formattedValues[] = formatAttributeValues(resultSet, table);
            if (formattedValues[0] != null)
                aggregatedContent.append(formattedValues[0]);
            for (int i = 1; i < formattedValues.length; i++) {
                if (formattedValues[i] != null) aggregatedContent.append("\t")
                        .append(formattedValues[i]);
                else aggregatedContent.append("\t");
            }
            aggregatedContent.append("\n");
            rowCount++;
            detailCount++;
        }
        if (aggregatedContent.length() != 0) {
            insertTime += insertDetailRow(insertStmt, insertSql,
                    aggregatedContent, rowCount, table, prevPk0, prevPk1,
                    title, pkColumns.length);
            insertCount++;
        }
        int[] counts = { insertCount, detailCount, (int) insertTime };
        return counts;
    }

    private String getTableTitle(TableField table) {
        StringBuilder title = new StringBuilder();
        title.append("TABLE: ").append(table.getDisplayName()).append("\n");
        boolean firstField = true;
        for (AttributeField attribute : table
                .getAttributeFields(FieldScope.REPORT_MAKER)) {
            if (firstField) firstField = false;
            else title.append("\t");
            title.append("[").append(attribute.getDisplayName()).append("]");
        }
        return title.toString();
    }

    private String getWrappedSql(TableField table, String idSql, String[] pkColumns)
            throws WdkModelException {

        String queryName = table.getQuery().getFullName();
        String tableSql = ((SqlQuery) wdkModel.resolveReference(queryName))
                .getSql();
	String pkPredicates = "idq." + pkColumns[0] + " = tq." + pkColumns[0] + "\n";
	String pkList = "tq." + pkColumns[0];

        if (pkColumns.length > 1) {
	    pkPredicates += "AND idq." + pkColumns[1] + " = tq." + pkColumns[1] + "\n";
	    pkList += ", " + "tq." + pkColumns[1];
	}

        String sql = "select tq.*" + "\n" + "FROM (ID_QUERY) idq," + "\n"
                + "(select tq1.*, rownum as row_num from (TABLE_QUERY) tq1) tq"
                + "\n" + "WHERE\n"
                + pkPredicates
                + "ORDER BY " + pkList + ", tq.row_num";
        sql = sql.replace("ID_QUERY", idSql);
        sql = sql.replace("TABLE_QUERY", tableSql);
        // System.err.println(sql);
        return sql;
    }

    // convert values we get from the database into the displayable format
    // this includes resolving references within text and link attributes
    private String[] formatAttributeValues(ResultSet resultSet, TableField table)
            throws WdkModelException, SQLException, WdkUserException {

        String[] formattedValuesArray = new String[table
                .getAttributeFields(FieldScope.REPORT_MAKER).length];

        Map<String, String> formattedValuesMap = new HashMap<String, String>();

        int i = 0;
        for (AttributeField attribute : table
                .getAttributeFields(FieldScope.REPORT_MAKER)) {
            String formattedValue = formatValue(formattedValuesMap, table,
                    attribute, resultSet);
            formattedValuesArray[i++] = formattedValue;
        }
        return formattedValuesArray;
    }

    private String formatValue(Map<String, String> formattedValuesMap,
            TableField table, AttributeField attribute, ResultSet resultSet)
            throws WdkModelException, SQLException, WdkUserException {

        if (formattedValuesMap.containsKey(attribute.getName())) {
            return formattedValuesMap.get(attribute.getName());
        }

        if (attribute instanceof ColumnAttributeField) {
            String value = resultSet.getString(attribute.getName()
                    .toUpperCase());
            if (value == null) {
                String errorMessage = "Table Query ["
                        + table.getQuery().getFullName() + "] returns null "
                        + "value on attribute [" + attribute.getName()
                        + "]. The value will be treated as empty string,"
                        + " but please investigate.";
                // print out more error about the cause;
                logger.debug(errorMessage);
                // throw new WdkModelException(errorMessage);
                value = "";
            }
            formattedValuesMap.put(attribute.getName(), value);
            return value;
        }

        String text = null;
        if (attribute instanceof PrimaryKeyAttributeField) {
            text = ((PrimaryKeyAttributeField) attribute).getText();
        } else if (attribute instanceof TextAttributeField) {
            text = ((TextAttributeField) attribute).getText();
        } else if (attribute instanceof LinkAttributeField) {
            text = ((LinkAttributeField) attribute).getDisplayText();
        } else {
        	throw new WdkModelException("Unsupported type for attribute: " + attribute.getName());
        }

        Map<String, ColumnAttributeField> children = attribute
                .getColumnAttributeFields();
        for (ColumnAttributeField child : children.values()) {
            String key = "$$" + child.getName() + "$$";
            String childValue = formatValue(formattedValuesMap, table, child,
                    resultSet);
            text = text.replace(key, childValue);
        }
        text = text.trim();
        formattedValuesMap.put(attribute.getName(), text);
        return text;
    }

    /**
     * Aggregate the rows by records, and insert the result into detail table.
     * 
     * @param table
     * @param idSql
     * @throws WdkModelException
     * @throws SQLException
     * @throws WdkUserException
     */
    private long insertDetailRow(PreparedStatement insertStmt,
            String insertSql, StringBuilder contentBuf, int rowCount,
				 TableField table, String pk0, String pk1, String title, int pkCount)
            throws WdkModelException, SQLException, WdkUserException {

        long start = System.currentTimeMillis();

        // trim trailing newline (but not leading white space)
        String content = contentBuf.toString();
        DBPlatform platform = wdkModel.getQueryPlatform();

        // (<primary keys>, field_name, field_title, row_count, content,
        // modification_date)
        insertStmt.setString(1, pk0);
	if (pkCount > 1) {
	    insertStmt.setString(2, pk1);
	}
        insertStmt.setString(pkCount + 1, table.getName());
        insertStmt.setString(pkCount + 2, title);
        insertStmt.setInt(pkCount + 3, rowCount);
        if (content.length() < 32766) insertStmt.setString(pkCount + 4, content);
        else platform.setClobData(insertStmt, pkCount + 4, content, false);

        insertStmt.setTimestamp(pkCount + 5, new Timestamp(new Date().getTime()));
        SqlUtils.executePreparedStatement(wdkModel, insertStmt, insertSql,
                 table.getQuery().getFullName() + "__api-report-detail-insert");
        return System.currentTimeMillis() - start;
    }

}
