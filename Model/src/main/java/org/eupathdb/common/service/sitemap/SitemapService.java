package org.eupathdb.common.service.sitemap;

import static org.gusdb.fgputil.functional.Functions.fSwallow;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.Tuples.ThreeTuple;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.answer.factory.AnswerValueFactory;
import org.gusdb.wdk.model.answer.spec.AnswerSpec;
import org.gusdb.wdk.model.question.Question;
import org.gusdb.wdk.model.record.RecordClass;
import org.gusdb.wdk.model.user.StepContainer;
import org.gusdb.wdk.service.service.AbstractWdkService;

@Path("sitemap")
public class SitemapService extends AbstractWdkService {

  private static final Logger LOG = Logger.getLogger(SitemapService.class);

  @GET
  @Produces(MediaType.TEXT_XML)
  public String getSiteMap(@QueryParam("fmt") String fmt) {
    String urlBase = getContextUri();
    String sitemaps = Arrays.stream(getWdkModel().getAllQuestionSets())
        .flatMap(questionSet -> Arrays.stream(questionSet.getQuestions()))
        .filter(question -> question.getPropertyLists().containsKey("forSitemap")).map(question -> "<sitemap><loc>"
            + urlBase + fmt.replace("{question}", question.getName()) + "</loc></sitemap>")
        .collect(Collectors.joining(""));

    return "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n"
        + "<sitemapindex xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" "
        + "xsi:schemaLocation=\"http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd\" "
        + "xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">" + sitemaps + "</sitemapindex>";
  }

  @GET
  @Path("{questionName}")
  @Produces(MediaType.TEXT_XML)
  public String getSiteMapForQuestion(@PathParam("questionName") String questionName, @QueryParam("fmt") String fmt) throws WdkModelException {
    String urlBase = getContextUri();

    // find question for sitemap.xml
    Optional<Question> maybeQuestion = getWdkModel().getQuestionByName(questionName)
        .filter(question -> question.getPropertyLists().containsKey("forSitemap"));

    Optional<RecordClass> maybeRecordClass = maybeQuestion
        .flatMap(question -> getWdkModel().getRecordClassByName(question.getRecordClassName()));

    Optional<List<String[]>> maybeAllIds = maybeQuestion
      .map(fSwallow(question ->
        AnswerValueFactory.makeAnswer(
          getSessionUser(),
          AnswerSpec.builder(getWdkModel())
            .setQuestionFullName(question.getFullName())
            .buildRunnable(getSessionUser(), StepContainer.emptyContainer())
        )
        .getAllIds()
      ));

    Optional<ThreeTuple<Question, RecordClass, List<String[]>>> maybeData = maybeQuestion
        .flatMap(question -> maybeRecordClass.flatMap(recordClass -> maybeAllIds
            .map(allIds -> new ThreeTuple<Question, RecordClass, List<String[]>>(question, recordClass, allIds))));

    return maybeData.map(data -> {
      String urls = data.getThird().stream().map(id -> {
        String idPart = Arrays.stream(id).map(part ->
          URLEncoder.encode(part, StandardCharsets.UTF_8)).collect(Collectors.joining("/"));

        String url = urlBase + fmt
          .replace("{recordClass}", URLEncoder.encode(data.getSecond().getUrlSegment(), StandardCharsets.UTF_8))
          .replace("{id}", idPart);

        return "<url><loc>" + url + "</loc></url>";
      }).collect(Collectors.joining(""));
      return "<?xml version='1.0' encoding='UTF-8'?>\n"
          + "<urlset xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" "
          + "xsi:schemaLocation=\"http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd\">"
          + urls + "</urlset>";
    }).orElse("");
  }
}
