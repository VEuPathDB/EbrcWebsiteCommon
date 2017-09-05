package org.eupathdb.common.taglib.wdk;


import javax.servlet.ServletContext;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.jsp.JspContext;
import javax.servlet.jsp.JspException;
import javax.servlet.jsp.PageContext;
import javax.servlet.jsp.tagext.SimpleTagSupport;

import org.gusdb.wdk.controller.CConstants;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.jspwrap.WdkModelBean;


public abstract class WdkTagBase extends SimpleTagSupport {

    private WdkModelBean _wdkModelBean;
    private WdkModel _wdkModel;
    private int _varScope;

    /**
     * Initializes base class with Page scope (see constants in PageContext)
     */
    public WdkTagBase() {
        _varScope = PageContext.PAGE_SCOPE;
    }
    
    /**
     * Initializes base class with given scope
     * 
     * @param varScope scope of this tag (see constants in PageContext)
     */
    public WdkTagBase(int varScope) {
        _varScope = varScope;
    }

    @Override
    public void doTag() throws JspException {
        setWdkModelBean();
        setWdkModel();
    }
    
    public void setWdkModel() {
        _wdkModel = _wdkModelBean.getModel();
    }

    protected WdkModel getWdkModel() {
        return _wdkModel;
    }
    
    public void setWdkModelBean() {
        _wdkModelBean = (WdkModelBean) this.getContext().
        getAttribute(CConstants.WDK_MODEL_KEY);
    }

    protected WdkModelBean getWdkModelBean() {
        return _wdkModelBean;
    }
    
    protected boolean export(String var, Object value) {
        return export(var, value, _varScope);
    }

    protected boolean export(String var, Object value, int varScope) {
       JspContext jspContext = getJspContext();
       if (value != null)
           jspContext.setAttribute(var, value, varScope);
       else
           jspContext.removeAttribute(var, varScope);
       return true;
    }
    
    protected ServletRequest getRequest() {
        return ((PageContext)getJspContext()).getRequest();
    }

    protected ServletResponse getResponse() {
        return ((PageContext)getJspContext()).getResponse();
    }

    protected ServletContext getContext() {
        return ((PageContext)getJspContext()).
                  getServletConfig().getServletContext();
    }

    protected ServletContext getApplication() {
        return getContext();
    }

}