package org.eupathdb.common.taglib.wdk.table;

import java.io.IOException;
import java.util.Iterator;
import java.util.Map;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.tagext.SimpleTagSupport;

import org.gusdb.wdk.model.record.attribute.AttributeValue;

public class RowTag extends SimpleTagSupport {
    private Iterator<Map<String, AttributeValue>> iterator;
    private String var;
    private Map<String, AttributeValue> row;

    @Override
    public void doTag() throws JspException, IOException {
        TableTag wdkTable = (TableTag)findAncestorWithClass(
            this, TableTag.class);

        iterator = wdkTable.getTableFieldValue().iterator();
        
        if (iterator == null) {
            return;
        }
        
        while (iterator.hasNext()) {
            row = iterator.next();
            getJspContext().setAttribute(var, row);
            getJspBody().invoke(null);
        }
        
    }

    public void setVar(String var) {
        this.var = var;
    }
    
    protected Map<String, AttributeValue> getRow() {
        return row;
    }
}

