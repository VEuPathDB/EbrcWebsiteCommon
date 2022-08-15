package org.eupathdb.common.service.sitemap;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.stream.Collectors;

import javax.ws.rs.GET;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.iterator.IteratorUtil;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.WdkRuntimeException;
import org.gusdb.wdk.model.answer.AnswerValue;
import org.gusdb.wdk.model.answer.factory.AnswerValueFactory;
import org.gusdb.wdk.model.answer.spec.AnswerSpec;
import org.gusdb.wdk.model.question.Question;
import org.gusdb.wdk.model.record.PrimaryKeyIterator;
import org.gusdb.wdk.model.user.StepContainer;
import org.gusdb.wdk.service.service.AbstractWdkService;

@Path("sitemap")
public class SitemapService extends AbstractWdkService {

  private static final Logger LOG = Logger.getLogger(SitemapService.class);

  @GET
  @Produces(MediaType.TEXT_XML)
  public String getSiteMap(
      @QueryParam("fmt") String fmt
  ) {
    String urlBase = getContextUri();
    String sitemaps = Arrays
        .stream(getWdkModel().getAllQuestionSets())
        .flatMap(questionSet -> Arrays.stream(questionSet.getQuestions()))
        .filter(question -> question.getPropertyLists().containsKey("forSitemap"))
        .map(question -> "<sitemap><loc>" + urlBase + fmt.replace("{question}", question.getName()) + "</loc></sitemap>")
        .collect(Collectors.joining(""));

    return
        "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n" +
        "<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">" +
        sitemaps +
        "</sitemapindex>";
  }

  @GET
  @Path("{questionName}")
  @Produces(MediaType.TEXT_XML)
  public Response getSiteMapForQuestion(
      @PathParam("questionName") String questionName,
      @QueryParam("fmt") String fmt
  ) throws WdkModelException {

    // find question for sitemap.xml
    Question question = getWdkModel().getQuestionByName(questionName)
        .filter(q -> q.getPropertyLists().containsKey("forSitemap"))
        .orElseThrow(() -> new NotFoundException());

    // only zero-param questions are valid for site map
    if (!question.getParamMap().isEmpty()) {
      throw new WdkModelException("Invalid question '" + question.getFullName() + "' for site map: only questions with no params can be used.");
    }

    // build answer for this question
    AnswerValue answer = AnswerValueFactory.makeAnswer(
        getSessionUser(),
        AnswerSpec.builder(getWdkModel())
          .setQuestionFullName(question.getFullName())
          .buildRunnable(getSessionUser(), StepContainer.emptyContainer()));

    return Response.ok(new RecordUrlDumper(getContextUri(), fmt, answer)).build();
  }

  private static class RecordUrlDumper implements StreamingOutput {

    private final String _urlBase;
    private final String _urlFormat;
    private final AnswerValue _answer;

    public RecordUrlDumper(String urlBase, String urlFormat, AnswerValue answer) {
      _urlBase = urlBase;
      _urlFormat = urlFormat;
      _answer = answer;
    }

    @Override
    public void write(OutputStream output) throws IOException, WebApplicationException {
      // read IDs, convert to URLs and output XML
      try (PrimaryKeyIterator allIds = _answer.getAllIds();
           BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(output))) {

        writer.write("<?xml version='1.0' encoding='UTF-8'?>");
        writer.newLine();
        writer.write("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
        writer.newLine();

        String recordClassUrlSegment = _answer.getAnswerSpec().getQuestion().getRecordClass().getUrlSegment();
        String urlFormat = _urlFormat.replace("{recordClass}", URLEncoder.encode(recordClassUrlSegment, StandardCharsets.UTF_8));

        for (String[] id : IteratorUtil.toIterable(allIds)) {

          String idPart = Arrays.stream(id)
              .map(part -> URLEncoder.encode(part, StandardCharsets.UTF_8))
              .collect(Collectors.joining("/"));

          writer.write("  <url><loc>");
          writer.write(_urlBase);
          writer.write(urlFormat.replace("{id}", idPart));
          writer.write("</loc></url>");
          writer.newLine();
        }

        writer.write("</urlset>");
        writer.newLine();
      }
      catch (Exception e) {
        LOG.error("Unable to stream stie map URL list", e);
        throw new WdkRuntimeException("Unable to stream site map URL list", e);
      }
    }
  }
}
