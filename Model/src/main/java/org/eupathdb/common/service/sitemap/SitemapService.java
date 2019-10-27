package org.eupathdb.common.service.sitemap;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkUserException;
import org.gusdb.wdk.model.dbms.ResultList;
import org.gusdb.wdk.model.query.Query;
import org.gusdb.wdk.model.query.QueryInstance;
import org.gusdb.wdk.model.record.PrimaryKeyDefinition;
import org.gusdb.wdk.model.record.PrimaryKeyValue;
import org.gusdb.wdk.model.record.RecordClass;
import org.gusdb.wdk.service.service.AbstractWdkService;

@Path("sitemap")
public class SitemapService extends AbstractWdkService {

  private static final String recordPagePath = "app/record";

  @GET
  @Path("{recordType}")
  @Produces(MediaType.TEXT_PLAIN)
  public Response getSiteMap(@PathParam("recordType") String recordType) throws WdkModelException, WdkUserException {
    RecordClass recordClass = getWdkModel().getRecordClassByUrlSegment(recordType);
    if (recordClass == null || !recordClass.hasAllRecordsQuery()) return Response.ok("").build();

    PrimaryKeyDefinition pkDef = recordClass.getPrimaryKeyDefinition();
    List<String> urls = new LinkedList<>();
    String urlBase = getContextUri();
    Query allRecordsQuery = recordClass.getAllRecordsQuery();
    QueryInstance<?> queryInstance = allRecordsQuery.makeInstance(getSessionUser(), new HashMap<String, String>(), true, 0, new HashMap<String, String>());
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