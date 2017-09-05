/**
Retrieve XML-formated messages stored in the apicomm database for given project (AmoebaDB,
etc) and category (e.g. Event (see announce.messages.message_category in apicomm for
other categories that may or may not be stored as XML).

Exports an an XML document to the JSP request page suitable for XSLT. 

The default is to retrieve only records that are not past their stop date. This can
be changed by setting range to 'expired' or 'all'.

The sort order can be specified by setting stopDateSort to ASC or DESC.

Example usage

<api:xmlMessages var="expiredEvents" 
    messageCategory="Event"
    stopDateSort="DESC"
    range="expired"
/>
<c:import var="xslt" url="${xsltUrl}" />
<x:transform xml="${expiredEvents}" xslt="${xslt}" />

**/
package org.eupathdb.common.taglib.wdk;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;

import javax.servlet.jsp.JspException;
import javax.sql.DataSource;

import org.gusdb.fgputil.db.SqlUtils;

public class SiteXmlMessagesTag extends WdkTagBase {

    private String _var;
    private String _projectName;
    private String _messageCategory;
    private String _range;
    private String _stopDateSort = "ASC";

    @Override
    public void doTag() throws JspException {
        super.doTag();
        
        String xml = xmlMessageRecordSet(_projectName, _messageCategory, _range);
        
        this.getRequest().setAttribute(_var, xml);
    }

    private String xmlMessageRecordSet(
                String projectName, String messageCategory, 
                String range) throws JspException  {

        ArrayList<ArrayList<String>> messages;
        
        try {
            messages = fetchMessages(projectName, messageCategory, range);
        } catch (SQLException sqle) {
            throw new JspException(sqle);
		}

        StringBuffer xml =  new StringBuffer();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<records>\n");
        for (ArrayList<String> message : messages) {
            xml.append("<record>\n");
            xml.append(                       message.get(0) );
            xml.append("<recid>"            + message.get(1) + "</recid>\n");
            xml.append("<displayStartDate>" + message.get(2) + "</displayStartDate>\n");
            xml.append("<displayStopDate>"  + message.get(3) + "</displayStopDate>\n");
            xml.append("<submissionDate>"   + message.get(4) + "</submissionDate>\n");
            xml.append("</record>\n");
        }
        xml.append("</records>\n");
        return xml.toString();
    }

    private ArrayList<ArrayList<String>> fetchMessages(
            String projectName, String messageCategory, 
            String range) throws SQLException {

        ArrayList<ArrayList<String>> messages = new ArrayList<ArrayList<String>>();
        ResultSet rs = null;
        PreparedStatement ps = null;
       
        try {
            if (projectName == null || projectName.equals("")) {
                ps = allProjectsPreparedStatement(messageCategory, range);
            } else {
                ps = specificProjectPreparedStatement(projectName, messageCategory, range);        
            }
            
            rs = ps.executeQuery();

            while (rs.next()) {
                ResultSetMetaData rsmd = rs.getMetaData();
                int numColumns = rsmd.getColumnCount();
                ArrayList<String> record = new ArrayList<String>();
                for (int i=1; i<numColumns+1; i++) {
                    record.add(rs.getString(i));
                }
                 messages.add(record);
            }

        } catch (SQLException sqle) {
            throw sqle;
        } finally {
            SqlUtils.closeResultSetAndStatement(rs, ps);
        }
        
        return messages;
    }

    private PreparedStatement specificProjectPreparedStatement(
            String projectName, String messageCategory, String range) throws SQLException {

        PreparedStatement ps;
        DataSource dataSource = getWdkModel().getUserDb().getDataSource();
       
        StringBuffer sql = new StringBuffer();
        sql.append(" SELECT m.message_text, m.message_id,                 ");
        sql.append(" TO_CHAR(start_date, 'Dy, dd Mon yyyy hh24:mi:ss'),   ");
        sql.append(" TO_CHAR(stop_date, 'Dy, dd Mon yyyy hh24:mi:ss'),    ");
        sql.append(" TO_CHAR(time_submitted, 'd Month yyyy HH:mm')        ");
        sql.append(" FROM announce.messages m, announce.category c,       ");
        sql.append("      announce.projects p,                            ");
        sql.append("      announce.message_projects mp                    ");
        sql.append(" WHERE p.project_id = mp.project_id                   ");
        sql.append(" AND mp.message_id = m.message_id                     ");
        sql.append(" AND m.message_category  =  c.category_name           ");
        sql.append(" AND lower(m.message_category) = ?                    ");
        sql.append(" AND p.project_name = ?                               ");
        sql.append(  rangeJoin(range)                                      );
        sql.append(" order by m.stop_date " + _stopDateSort                 );

        ps = SqlUtils.getPreparedStatement(dataSource, sql.toString());
        ps.setString(1, messageCategory.toLowerCase());
        ps.setString(2, projectName);
        
        return ps;
    }
    
    private PreparedStatement allProjectsPreparedStatement(
            String messageCategory, String range) throws SQLException {

        PreparedStatement ps;
        DataSource dataSource = getWdkModel().getUserDb().getDataSource();
       
        StringBuffer sql = new StringBuffer();
        sql.append(" SELECT m.message_text, m.message_id,                 ");
        sql.append(" TO_CHAR(start_date, 'Dy, dd Mon yyyy hh24:mi:ss'),   ");
        sql.append(" TO_CHAR(stop_date, 'Dy, dd Mon yyyy hh24:mi:ss'),    ");
        sql.append(" TO_CHAR(time_submitted, 'd Month yyyy HH:mm')        ");
        sql.append(" FROM announce.messages m, announce.category c        ");
        sql.append(" WHERE m.message_category = c.category_name           ");
        sql.append(" AND lower(m.message_category) = ?                    ");
        sql.append(  rangeJoin(range)                                      );
        sql.append(" order by m.stop_date " + _stopDateSort                 );
        
        ps = SqlUtils.getPreparedStatement(dataSource, sql.toString());
        ps.setString(1, messageCategory.toLowerCase());
        
        return ps;
    }
        
    private StringBuffer rangeJoin(String range) {
        StringBuffer join = new StringBuffer();

        if (range != null && range.toLowerCase().equals("all")) 
            join.append("");
        else if (range != null && range.toLowerCase().equals("expired"))
            join.append( " AND CURRENT_TIMESTAMP > STOP_DATE " );
        else {
            join.append( " AND CURRENT_TIMESTAMP "            );
            join.append( " BETWEEN START_DATE AND STOP_DATE " );
        }
        
        return join;
    }    

    public void setVar(String var) {
        _var = var;
    }

    public void setProjectName(String projectName) {
        _projectName = projectName;
    }

    public void setMessageCategory(String messageCategory) {
        _messageCategory = messageCategory;
    }

    public void setRange(String range) {
        // todo: validate allowed values 'all' or 'expired'
        _range = range;
    }

    public void setStopDateSort(String stopDateSort) {
        // todo: validate allowed values 'ASC' or 'DESC'
        _stopDateSort = stopDateSort;
    }

}
