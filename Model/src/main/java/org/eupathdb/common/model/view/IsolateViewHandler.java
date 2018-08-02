package org.eupathdb.common.model.view;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.db.SqlUtils;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkUserException;
import org.gusdb.wdk.model.answer.SummaryViewHandler;
import org.gusdb.wdk.model.answer.factory.AnswerValue;
import org.gusdb.wdk.model.user.Step;
import org.gusdb.wdk.model.user.User;

public abstract class IsolateViewHandler implements SummaryViewHandler {

    private static final String PROP_SEQUENCES = "isolates";
    private static final String PROP_MAX_LENGTH = "maxLength";

    private static final Logger logger = Logger.getLogger(IsolateViewHandler.class);

    public abstract String prepareSql(String idSql) throws WdkModelException,
            WdkUserException;

    @Override
    public Map<String, Object> process(Step step, Map<String, String[]> params,
        User user, WdkModel wdkModel) throws WdkModelException, WdkUserException {
        logger.debug("Entering IsolateViewHandler...");

        ResultSet resultSet = null;
        try {
            AnswerValue answerValue = step.getAnswerValue();
            String sql = prepareSql(answerValue.getIdSql());
            DataSource dataSource = wdkModel.getAppDb().getDataSource();
            resultSet = SqlUtils.executeQuery(dataSource, sql,
                    step.getAnswerSpec().getQuestion().getQuery().getFullName() + "__isolate-view", 2000);

            int maxLength = 0;
            Map<String, Isolate> isolates = new HashMap<String, Isolate>();
            while (resultSet.next()) {
                String isolateId = resultSet.getString("country");
                Isolate isolate = isolates.get(isolateId);
                if (isolate == null) {
                    isolate = new Isolate(isolateId);
                    isolates.put(isolateId, isolate);

                    isolate.setTotal(resultSet.getInt("total"));
                    isolate.setLat(resultSet.getDouble("latitude"));
                    isolate.setLng(resultSet.getDouble("longitude"));
                    isolate.setGaz(resultSet.getString("gaz"));
                }
            }

            // sort sequences by source ids
            String[] isolateIds = isolates.keySet().toArray(new String[0]);
            Arrays.sort(isolateIds);
            Isolate[] array = new Isolate[isolateIds.length];
            for (int i = 0; i < isolateIds.length; i++) {
                array[i] = isolates.get(isolateIds[i]);
            }   

            Map<String, Object> results = new HashMap<String, Object>();
            results.put(PROP_SEQUENCES, array);
            results.put(PROP_MAX_LENGTH, maxLength);
            logger.debug("Leaving IsolateViewHandler...");
            return results;
        } catch (SQLException ex) {
            logger.error(ex);
            ex.printStackTrace();
            throw new WdkModelException(ex);
        } finally {
            SqlUtils.closeResultSetAndStatement(resultSet, null);
        }
    }

    @Override
    public String processUpdate(Step step, Map<String, String[]> parameters, User user, WdkModel wdkModel)
        throws WdkModelException, WdkUserException {
      // this summary view does not perform updates
      return null;
    }
}
