package org.eupathdb.common.errors;

import java.util.List;
import java.util.Map;

import org.gusdb.wdk.controller.actionutil.RequestData;
import org.gusdb.wdk.model.WdkModel;

public class ErrorContext {
  
    private final WdkModel _wdkModel;
    private final String _projectName;
    private final RequestData _requestData;
    private final Map<String, Object> _servletContextAttributes;
    private final Map<String, Object> _requestAttributeMap;
    private final Map<String, Object> _sessionAttributeMap;
    
    public ErrorContext(WdkModel wdkModel,
            String projectName, RequestData requestData,
            Map<String, Object> servletContextAttributes,
            Map<String, Object> requestAttributeMap,
            Map<String, Object> sessionAttributeMap) {
        _wdkModel = wdkModel;
        _projectName = projectName;
        _requestData = requestData;
        _servletContextAttributes = servletContextAttributes;
        _requestAttributeMap = requestAttributeMap;
        _sessionAttributeMap = sessionAttributeMap;
    }

    public String getProjectName() { return _projectName; }
    public RequestData getRequestData() { return _requestData; }
    public Map<String, Object> getServletContextAttributes() { return _servletContextAttributes; }
    public Map<String, Object> getRequestAttributeMap() { return _requestAttributeMap; }
    public Map<String, Object> getSessionAttributeMap() { return _sessionAttributeMap; }

    /**
     * A site is considered monitored if the administrator email from adminEmail in the model-config.xml has content.
     * @return - true if the administrator email has content, false otherwise.
     */
    public boolean isSiteMonitored() {
      return !getAdminEmails().isEmpty();
    }

    /**
     * Collect the comma delimited list of administrator emails from adminEmail in the model-config.xml and
     * return them as an array
     * @return - array of administrator emails
     */
    public List<String> getAdminEmails() {
      return _wdkModel.getModelConfig().getAdminEmails();
    }
}
