package org.eupathdb.common.service.sitemap;

import java.util.LinkedList;
import java.util.List;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.gusdb.fgputil.validation.ValidObjectFactory.RunnableObj;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkUserException;
import org.gusdb.wdk.model.dbms.ResultList;
import org.gusdb.wdk.model.query.Query;
import org.gusdb.wdk.model.query.QueryInstance;
import org.gusdb.wdk.model.query.spec.QueryInstanceSpec;
import org.gusdb.wdk.model.record.PrimaryKeyDefinition;
import org.gusdb.wdk.model.record.PrimaryKeyValue;
import org.gusdb.wdk.model.record.RecordClass;
import org.gusdb.wdk.model.user.StepContainer;
import org.gusdb.wdk.service.service.AbstractWdkService;

@Path("sitemap")
public class SitemapService extends AbstractWdkService {

  private static final String recordPagePath = "app/record";

  @GET
  @Path("{recordType}")
  @Produces(MediaType.TEXT_PLAIN)
  public Response getSiteMap(@PathParam("recordType") String recordType) throws WdkModelException, WdkUserException {
    RecordClass recordClass = getWdkModel().getRecordClassByUrlSegment(recordType).orElse(null);
    if (recordClass == null || !recordClass.hasAllRecordsQuery()) return Response.ok("").build();

    PrimaryKeyDefinition pkDef = recordClass.getPrimaryKeyDefinition();
    List<String> urls = new LinkedList<>();
    String urlBase = getContextUri();
    Query allRecordsQuery = recordClass.getAllRecordsQuery();
    RunnableObj<QueryInstanceSpec> allRecordsQuerySpec = QueryInstanceSpec.builder()
      .buildRunnable(getSessionUser(), allRecordsQuery, StepContainer.emptyContainer());
    QueryInstance<?> queryInstance = Query.makeQueryInstance(allRecordsQuerySpec);
    ResultList resultList = queryInstance.getResults();
    while (resultList.next()) {
      PrimaryKeyValue pkValue = pkDef.getPrimaryKeyFromResultList(resultList);
      String url = urlBase + "/" + recordPagePath + "/" + recordType + "/" + String.join("/", pkValue.getValues().values());
      urls.add(url);
    }
    String responseString = String.join("\n", urls);
    return Response.ok(responseString).build();
  }
}
