package org.eupathdb.common.taglib.wdk.table;

import java.io.IOException;
import java.util.Iterator;
import java.util.Map.Entry;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.tagext.SimpleTagSupport;

public class ColumnTag extends SimpleTagSupport {
    private Iterator<?> iterator;
    private String var;

    @Override
    public void doTag() throws JspException, IOException {
        RowTag row = (RowTag)findAncestorWithClass(
            this, RowTag.class);

        iterator = row.getRow().entrySet().iterator();
        
        if (iterator == null) {
            return;
        }
        while (iterator.hasNext()) {
            Entry<?,?> col = (Entry<?,?>)iterator.next();
            getJspContext().setAttribute(var, col.getValue());
            getJspBody().invoke(null);
        }
        
    }
    
    public void setVar(String var) {
        this.var = var;
    }

}
