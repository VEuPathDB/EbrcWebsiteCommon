package org.eupathdb.common.controller.action;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;
import org.gusdb.wdk.controller.action.ShowQuestionAction;
import org.gusdb.wdk.controller.actionutil.ActionUtility;
import org.gusdb.wdk.model.jspwrap.QuestionBean;
import org.gusdb.wdk.model.jspwrap.WdkModelBean;

public class CommonShowQuestionAction extends ShowQuestionAction {
  
  private static String WIZARD_PARAM_NAME = "wizard";
  private static String QUESTION_PARAM_NAME = "questionFullName";
  private static String QUESTION_ATTR_NAME = "question";

  public ActionForward execute(ActionMapping mapping, ActionForm form, HttpServletRequest request,
      HttpServletResponse response) throws Exception {
    WdkModelBean wdkModel = ActionUtility.getWdkModel(servlet);
    QuestionBean question = wdkModel.getQuestion(request.getParameter(QUESTION_PARAM_NAME));
    String[] wizard = question.getPropertyList(WIZARD_PARAM_NAME);
    if ("true".equals(wizard[0])) {
      request.setAttribute(QUESTION_ATTR_NAME, request.getParameter(QUESTION_PARAM_NAME));
      return mapping.findForward("wizard");
    }
    return super.execute(mapping, form, request, response);
  }

}
