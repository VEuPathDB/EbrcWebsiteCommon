package org.eupathdb.common.taglib.wdk.table;

import java.io.IOException;
import java.util.Map;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.PageContext;
import javax.servlet.jsp.tagext.SimpleTagSupport;

import org.gusdb.wdk.controller.CConstants;
import org.gusdb.wdk.model.jspwrap.RecordBean;
import org.gusdb.wdk.model.record.TableValue;

public class TableTag extends SimpleTagSupport {
    private String var;
    private TableValue tableFieldValue;
    public String tableName;

    @Override
    public void doTag() throws JspException, IOException {
        setTableFieldValue();
        getJspContext().setAttribute(var,tableFieldValue);
        getJspBody().invoke(null);
    }
    
    public void setTableName(String tableName) {
        this.tableName = tableName;
    }
    
    public void setVar(String var) {
        this.var = var;
    }

    private void setTableFieldValue() throws JspException {
        try {
            Map<String, TableValue> tables = getRecord().getTables();
            tableFieldValue = tables.get(tableName);
        } catch (Exception e) {
            throw new JspException(e);
        }
    }
    
    protected TableValue getTableFieldValue() {
        return tableFieldValue;
    }
    
    private RecordBean getRecord() {
        return ((RecordBean)(
            (PageContext)getJspContext()).
                getRequest().
                  getAttribute(CConstants.WDK_RECORD_KEY));
    }

}
