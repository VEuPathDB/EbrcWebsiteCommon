package org.eupathdb.common.service;

import java.util.HashMap;
import java.util.Map;

import javax.ws.rs.GET;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.gusdb.fgputil.validation.ValidObjectFactory.DisplayablyValid;
import org.gusdb.fgputil.validation.ValidationLevel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.answer.spec.AnswerSpec;
import org.gusdb.wdk.model.query.param.AbstractEnumParam;
import org.gusdb.wdk.model.query.spec.ParameterContainerInstanceSpecBuilder.FillStrategy;
import org.gusdb.wdk.model.query.spec.QueryInstanceSpec;
import org.gusdb.wdk.model.question.Question;
import org.gusdb.wdk.model.user.StepContainer;
import org.gusdb.wdk.service.request.exception.DataValidationException;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONObject;

@Path("/blast-param-internal-values/{questionUrlSegment}")
public class BlastFormInternalValuesService extends AbstractWdkService {

  public static final String DB_TYPE_PARAM_NAME = "BlastDatabaseType";
  public static final String ORGANISM_PARAM_NAME = "BlastDatabaseOrganism";

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public JSONObject getBlastParamInternalValues(@PathParam("questionUrlSegment") String questionUrlSegment) throws WdkModelException, DataValidationException {

    // confirm question exists and is a BLAST question (i.e. has BlastDatabaseType param)
    Question question = getQuestionOrNotFound(questionUrlSegment);
    if (!question.getParamMap().containsKey(DB_TYPE_PARAM_NAME)) {
      throw new NotFoundException("Question " + questionUrlSegment + " is not a BLAST question.");
    }

    // get vocabulary for DB type
    AbstractEnumParam typeParam = (AbstractEnumParam)question.getParamMap().get(DB_TYPE_PARAM_NAME);
    DisplayablyValid<QueryInstanceSpec> spec = getQueryInstanceSpec(question, null);
    Map<String,String> dbTypeValueMap = typeParam.getVocabInstance(spec).getVocabMap();

    // populate organism values if org param present
    Map<String,Map<String,String>> organismValuesMap = new HashMap<>();
    if (question.getParamMap().containsKey(ORGANISM_PARAM_NAME)) {
      AbstractEnumParam orgParam = (AbstractEnumParam)question.getParamMap().get(ORGANISM_PARAM_NAME);
      String defaultTypeTerm = spec.get().get(DB_TYPE_PARAM_NAME);
      organismValuesMap.put(defaultTypeTerm, orgParam.getVocabInstance(spec).getVocabMap());
      for (String typeTerm : dbTypeValueMap.keySet()) {
        if (!typeTerm.equals(defaultTypeTerm)) { // map for default db type already added
          spec = getQueryInstanceSpec(question, typeTerm);
          organismValuesMap.put(typeTerm, orgParam.getVocabInstance(spec).getVocabMap());
        }
      }
    }

    // build JSON and return
    JSONObject json = new JSONObject();
    for (String dbType : dbTypeValueMap.keySet()) {
      json.put(dbType, new JSONObject()
        .put("dbTypeInternal", dbTypeValueMap.get(dbType))
        .put("organismValues", organismValuesMap.get(dbType)));
    }
    return json;
  }

  private  DisplayablyValid<QueryInstanceSpec> getQueryInstanceSpec(Question question, String dbTypeStableValue)
      throws WdkModelException, DataValidationException {
    return AnswerSpec.getValidQueryInstanceSpec(AnswerSpec
      .builder(getWdkModel())
      .setQuestionFullName(question.getFullName())
      .setParamValue(DB_TYPE_PARAM_NAME, dbTypeStableValue)
      .build(getSessionUser(), StepContainer.emptyContainer(),
          ValidationLevel.DISPLAYABLE, FillStrategy.FILL_PARAM_IF_MISSING)
      .getDisplayablyValid()
      .getOrThrow(invalid -> new DataValidationException(invalid.getValidationBundle())));
  }
}
