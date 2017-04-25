/**
Retrieve messages stored in the apicomm database for given project (AmoebaDB,
etc) and category (Information, Event, Degraded, etc (see 
announce.messages.message_category in apicomm)).

Exports an ArrayList to the JSP request page. Example usage

  <api:messages var="messages" projectName="CryptoDB" 
                messageCategory="Information"/>
  <c:forEach var="message" items="${messages}" varStatus="stat">
    ${message}
  </c:forEach>

**/
package org.eupathdb.common.taglib.wdk;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;

import javax.servlet.jsp.JspException;
import javax.sql.DataSource;

import org.gusdb.fgputil.db.SqlUtils;
import org.json.JSONArray;

public class SiteMessagesTag extends WdkTagBase {

    private String var;
    private String projectName;
    private String messageCategory;
    public ArrayList<String> messages;

    @Override
    public void doTag() throws JspException {
        super.doTag();

        fetchMessages(projectName, messageCategory);
        this.getRequest().setAttribute(var, new JSONArray(messages).toString());
    }

    private void fetchMessages(String projectName, String messageCategory) throws JspException {
        messages = new ArrayList<String>();
        ResultSet rs = null;
        PreparedStatement ps = null;
        StringBuffer sql = new StringBuffer();
       
        sql.append(" SELECT m.message_text                                       ");
        sql.append(" FROM announce.messages m, announce.category c,              ");
        sql.append(" announce.projects p, announce.message_projects mp           ");
        sql.append(" WHERE p.project_name = ?                                    ");
        sql.append(" AND p.project_id = mp.project_id                            ");
        sql.append(" AND mp.message_id = m.message_id                            ");
        sql.append(" AND m.message_category  =  c.category_name                  ");
        sql.append(" AND CURRENT_TIMESTAMP BETWEEN START_DATE AND STOP_DATE      ");
        sql.append(" AND lower(m.message_category) = ?                           ");
        sql.append(" ORDER BY m.message_id DESC                                  ");
        
        try {
            DataSource dataSource = getWdkModel().getUserDb().getDataSource();
            ps = SqlUtils.getPreparedStatement(dataSource, sql.toString());
            ps.setString(1, projectName);
            ps.setString(2, messageCategory.toLowerCase());
            rs = ps.executeQuery();
            while (rs.next()) {
                messages.add(rs.getString(1) );
            }
        } catch (SQLException sqle) {
            throw new JspException(sqle);
        } finally {
            SqlUtils.closeResultSetAndStatement(rs, ps);
        }

    }
    
    public void setVar(String var) {
        this.var = var;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public void setMessageCategory(String messageCategory) {
        this.messageCategory = messageCategory;
    }


}
