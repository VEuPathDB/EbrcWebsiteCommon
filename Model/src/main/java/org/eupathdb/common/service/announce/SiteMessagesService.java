package org.eupathdb.common.service.announce;

import java.sql.Types;

import javax.sql.DataSource;
import javax.ws.rs.GET;
import javax.ws.rs.Path;

import org.gusdb.fgputil.db.runner.SQLRunner;
import org.gusdb.fgputil.db.runner.SQLRunnerException;
import org.gusdb.wdk.core.api.JsonKeys;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Retrieves messages stored in the apicomm database for given project and
 * category (Information, Event, Degraded, etc (see
 * announce.messages.message_category in apicomm)).
 */
@Path("/site-messages")
public class SiteMessagesService extends AbstractWdkService {

  private static final String SITE_MESSAGES_SQL =
      "select m.message_text, m.message_category" +
      "  from announce.messages m, announce.message_projects mp, announce.projects p" +
      " where m.message_id = mp.message_id" +
      "   and p.project_id = mp.project_id" +
      "   and p.project_name = ?" + 
      "   and current_timestamp between m.start_date and m.stop_date" +
      " order by m.message_id desc";

  private static final Integer[] PARAM_TYPES = { Types.VARCHAR };

  @GET
  public JSONArray getSiteMessages() throws WdkModelException {
    try {
      DataSource userDs = getWdkModel().getUserDb().getDataSource();
      return new SQLRunner(userDs, SITE_MESSAGES_SQL).executeQuery(
        new Object[] { getWdkModel().getProjectId() }, PARAM_TYPES, rs -> {
          JSONArray messages = new JSONArray();
          while (rs.next()) {
            messages.put(new JSONObject()
              .put(JsonKeys.CATEGORY, rs.getString("message_category"))
              .put(JsonKeys.MESSAGE, rs.getString("message_text")
            ));
          }
          return messages;
        }
      );
    }
    catch (SQLRunnerException e) {
      return WdkModelException.unwrap(e);
    }
  }
}
