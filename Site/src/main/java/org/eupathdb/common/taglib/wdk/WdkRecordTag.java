/**

Create a WDK record of given 'name' (e.g. TranscriptRecordClasses.TranscriptRecordClass).
Accepts dynamic attibutes. This allows passing required attributes (e.g source_id and 
project_id) to satisfy the given record. The attribute names defined in the JSP
should match the names required by the record.

Modeled after org.gusdb.wdk.controller.action.ShowRecordAction.

Usage in a JSP document:
  <%@ taglib prefix="api" uri="http://eupathdb.org/taglib" %>
  <api:wdkRecord name="UtilityRecordClasses.SiteInfo" />
  <c:set var="attrs" value="${wdkRecord.attributes}"/>
  ${attrs['primaryKey'].value}

  <%-- mix in another record, for no good reason other than you can --%>
  <api:wdkRecord name="TranscriptRecordClasses.TranscriptRecordClass" 
     recordKey="generec" source_id="TGME49_039250" project_id='ToxoDB' />
  <c:set var="geneattrs" value="${generec.attributes}"/>
  ${generec['primaryKey'].value}
 **/

package org.eupathdb.common.taglib.wdk;

import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.tagext.DynamicAttributes;

import org.gusdb.wdk.controller.CConstants;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.jspwrap.RecordBean;
import org.gusdb.wdk.model.jspwrap.RecordClassBean;
import org.gusdb.wdk.model.jspwrap.UserBean;

public class WdkRecordTag extends WdkTagBase implements DynamicAttributes {

    private String name;
    private String projectID;
    private String primaryKey;
    private String recordKey;

    private Map<String, String> dynamicAttrs;

    public WdkRecordTag() {
        dynamicAttrs = new LinkedHashMap<String, String>();
    }

    @Override
    public void doTag() throws JspException {
        super.doTag();

        RecordBean wdkRecord = getRecord();
        if (recordKey == null) recordKey = CConstants.WDK_RECORD_KEY;
        this.getRequest().setAttribute(recordKey, wdkRecord);
    }

    private RecordBean getRecord() throws JspException {

        setMinimumRecordKeys();

        try {
            RecordClassBean wdkRecordClass = getWdkModelBean().findRecordClass(name);

            String[] pkColumns = wdkRecordClass.getPrimaryKeyColumns();
            Map<String, Object> pkValues = new LinkedHashMap<String, Object>();

            for (String column : pkColumns) {
                String value = dynamicAttrs.get(column);
                if (value == null)
                    throw new WdkModelException("The required primary key "
                            + "value " + column + " for recordClass "
                            + wdkRecordClass.getFullName() + " is missing.");
                pkValues.put(column, value);
            }

            // use the system user
            // not sure how these tags are used.
            UserBean user = getWdkModelBean().getSystemUser();
            RecordBean wdkRecord = new RecordBean(user, wdkRecordClass,
                    pkValues);

            return wdkRecord;

        } catch (WdkModelException wme) {
            throw new JspException(wme);
        } catch (Exception e) {
            throw new JspException(e);
        }

    }

    public void setName(String name) {
        this.name = name;
    }

    public void setProjectID(String projectID) {
        this.projectID = projectID;
    }

    public void setPrimaryKey(String primaryKey) {
        this.primaryKey = primaryKey;
    }

    public void setRecordKey(String recordKey) {
        this.recordKey = recordKey;
    }

    @Override
    public void setDynamicAttribute(String uri, String localName, Object value)
            throws JspException {
        dynamicAttrs.put(localName, (String) value);
    }

    /**
     * The WDK requires certain key values for all records but those values
     * don't necessarily have meaning for some records. E.g. a primaryKey (aka
     * source_id, aka id) is not used by UtilityRecordClasses.SiteInfo so we
     * allow that to be optional in this API - set it to a space.
     * 
     * project_id is required but can typically be obtained from the model.
     * 
     * Also, this method masks the changing WDK API and proves backward
     * compatibility when possible.
     **/
    private void setMinimumRecordKeys() {
        if (projectID == null) projectID = getWdkModelBean().getProjectId();
        if (primaryKey == null) primaryKey = " ";

        if (dynamicAttrs.get("source_id") == null)
            dynamicAttrs.put("source_id", primaryKey);

        if (dynamicAttrs.get("project_id") == null)
            dynamicAttrs.put("project_id", projectID);

    }

}
