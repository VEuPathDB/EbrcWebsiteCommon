package org.eupathdb.common.model.view;

import java.util.HashMap;
import java.util.Map;

import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkUserException;
import org.gusdb.wdk.model.answer.SummaryViewHandler;
import org.gusdb.wdk.model.user.Step;
import org.gusdb.wdk.model.user.User;

public class BlastSummaryViewHandler implements SummaryViewHandler {

  public static final String ATTR_HEADER = "blastHeader";
  public static final String ATTR_MIDDLE = "blastMiddle";
  public static final String ATTR_FOOTER = "blastFooter";

  public static final String MACRO_SUMMARY = "__WSF_BLAST_SUMMARY__";
  public static final String MACRO_ALIGNMENT = "__WSF_BLAST_ALIGNMENT__";

  @Override
  public Map<String, Object> process(Step step, Map<String, String[]> parameters,
      User user, WdkModel wdkModel) throws WdkModelException, WdkUserException {
    Map<String, Object> attributes = new HashMap<>();

    // split template into 3 sections, header, middle, footer
    String message = step.getAnswerValue().getResultMessage();
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
  public String processUpdate(Step step, Map<String, String[]> parameters, User user, WdkModel wdkModel)
      throws WdkModelException, WdkUserException {
    // this summary view does not perform updates
    return null;
  }

}
