package org.eupathdb.common.taglib.wdk;

import javax.servlet.ServletContext;
import javax.servlet.jsp.JspException;

import org.gusdb.wdk.model.Utilities;
import org.gusdb.wdk.model.WdkModel;

public class ResetCacheTag extends WdkTagBase {

  @Override
  public void doTag() throws JspException {
    super.doTag();

    ServletContext context = getContext();
    String projectId = context.getInitParameter(Utilities.ARGUMENT_PROJECT_ID);
    String gusHome = context.getRealPath(context.getInitParameter(Utilities.SYSTEM_PROPERTY_GUS_HOME));

    try (WdkModel wdkModel = WdkModel.construct(projectId, gusHome)) {
      wdkModel.getResultFactory().getCacheFactory().resetCache(true, true);
    }
    catch (Exception e) {
      throw new JspException(e);
    }
  }
}
