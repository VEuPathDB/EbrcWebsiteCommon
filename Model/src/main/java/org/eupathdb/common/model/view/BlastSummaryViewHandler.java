package org.eupathdb.common.model.view;

import java.util.HashMap;
import java.util.Map;

import org.gusdb.fgputil.validation.ValidObjectFactory.RunnableObj;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkUserException;
import org.gusdb.wdk.model.answer.AnswerValue;
import org.gusdb.wdk.model.answer.SummaryViewHandler;
import org.gusdb.wdk.model.answer.factory.AnswerValueFactory;
import org.gusdb.wdk.model.answer.spec.AnswerSpec;
import org.gusdb.wdk.model.user.User;

public class BlastSummaryViewHandler implements SummaryViewHandler {

  public static final String ATTR_HEADER = "blastHeader";
  public static final String ATTR_MIDDLE = "blastMiddle";
  public static final String ATTR_FOOTER = "blastFooter";

  public static final String MACRO_SUMMARY = "__WSF_BLAST_SUMMARY__";
  public static final String MACRO_ALIGNMENT = "__WSF_BLAST_ALIGNMENT__";

  @Override
  public Map<String, Object> process(RunnableObj<AnswerSpec> answerSpec, Map<String, String[]> parameters,
      User user) throws WdkModelException, WdkUserException {
    Map<String, Object> attributes = new HashMap<>();

    // split template into 3 sections, header, middle, footer
    AnswerValue answer = AnswerValueFactory.makeAnswer(user, answerSpec);
    answer.setPageToEntireResult();
    String message = answer.getResultMessage().orElse("");
    String[] pieces = message.split(MACRO_SUMMARY, 2);
    attributes.put(ATTR_HEADER, pieces[0]);
    if (pieces.length > 1) {
      pieces = pieces[1].split(MACRO_ALIGNMENT, 2);
      attributes.put(ATTR_MIDDLE, pieces[0]);
      if (pieces.length > 1)
        attributes.put(ATTR_FOOTER, pieces[1]);
    }
    return attributes;
  }

  @Override
  public String processUpdate(RunnableObj<AnswerSpec> answerSpec, Map<String, String[]> parameters, User user)
      throws WdkModelException, WdkUserException {
    // this summary view does not perform updates
    return null;
  }

}
