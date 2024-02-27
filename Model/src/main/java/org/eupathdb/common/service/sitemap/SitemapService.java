package org.eupathdb.common.service.sitemap;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.stream.Collectors;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.DefaultValue;
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

  /**
   * Returns URLs of question pages which have been denoted with the property "forSitemap".
   *
   * @param fmt URL format
   */
  @GET
  @Produces(MediaType.TEXT_XML)
  public Response getSiteMap(
      @QueryParam("fmt") @DefaultValue("/app/search/{recordClass}/{question}") String fmt
  ) {
    String urlBase = getContextUri();

    StreamingOutput output = out -> {
      try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(out))) {
        writer.write("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>");
        writer.newLine();
        writer.write("<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
        writer.newLine();

        for (String urlXml : IteratorUtil.toIterable(Arrays
            .stream(getWdkModel().getAllQuestionSets())
            .flatMap(questionSet -> Arrays.stream(questionSet.getQuestions()))
            .filter(question -> question.getPropertyLists().containsKey("forSitemap"))
            .map(question -> formatUrl(fmt, question))
            .map(urlPath -> "<sitemap><loc>" + urlBase + urlPath + "</loc></sitemap>")
            .iterator())) {
          writer.write(urlXml);
          writer.newLine();
        }

        writer.write("</sitemapindex>");
        writer.newLine();
        writer.flush();
      }
    };

    return Response.ok(output).build();
  }

  /**
   * Returns URLs of all record pages for records returned by the passed question.
   * Notes:
   *   1. the question must be denoted with the "forSitemap" property or a 404 will be returned
   *   2. the question must not have parameters, or a 400 will be returned.
   *
   * @param fmt URL format
   */
  @GET
  @Path("{questionName}")
  @Produces(MediaType.TEXT_XML)
  public Response getSiteMapForQuestion(
      @PathParam("questionName") String questionName,
      @QueryParam("fmt") @DefaultValue("/app/record/{recordClass}/{id}") String fmt
  ) throws WdkModelException {

    // find question for sitemap.xml
    Question question = getWdkModel().getQuestionByName(questionName)
        .filter(q -> q.getPropertyLists().containsKey("forSitemap"))
        .orElseThrow(() -> new NotFoundException());

    // only zero-param questions are valid for site map
    if (!question.getParamMap().isEmpty()) {
      throw new BadRequestException("Invalid question '" + question.getFullName() + "' for site map: only questions with no params can be used.");
    }

    // build answer for this question
    AnswerValue answer = AnswerValueFactory.makeAnswer(
        getRequestingUser(),
        AnswerSpec.builder(getWdkModel())
          .setQuestionFullName(question.getFullName())
          .buildRunnable(getRequestingUser(), StepContainer.emptyContainer()));

    return Response.ok(new RecordUrlDumper(getContextUri(), fmt, answer)).build();
  }

  private static String formatUrl(String fmt, Question question) {
    String questionName = question.getName();
    String recordClassUrlSegment = question.getRecordClass().getUrlSegment();
    return fmt
        .replace("{question}", URLEncoder.encode(questionName, StandardCharsets.UTF_8))
        .replace("{recordClass}", URLEncoder.encode(recordClassUrlSegment, StandardCharsets.UTF_8));
  }

  private static class RecordUrlDumper implements StreamingOutput {

    private final String _urlBase;
    private final String _urlPath; // still has {id} macro unpopulated
    private final AnswerValue _answer;

    public RecordUrlDumper(String urlBase, String urlFormat, AnswerValue answer) {
      _urlBase = urlBase;
      _urlPath = formatUrl(urlFormat, answer.getAnswerSpec().getQuestion());
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

        for (String[] id : IteratorUtil.toIterable(allIds)) {

          String idPart = Arrays.stream(id)
              .map(part -> URLEncoder.encode(part, StandardCharsets.UTF_8))
              .collect(Collectors.joining("/"));

          writer.write("  <url><loc>");
          writer.write(_urlBase);
          writer.write(_urlPath.replace("{id}", idPart));
          writer.write("</loc></url>");
          writer.newLine();
        }

        writer.write("</urlset>");
        writer.newLine();
        writer.flush();
      }
      catch (Exception e) {
        LOG.error("Unable to stream stie map URL list", e);
        throw new WdkRuntimeException("Unable to stream site map URL list", e);
      }
    }
  }
}
