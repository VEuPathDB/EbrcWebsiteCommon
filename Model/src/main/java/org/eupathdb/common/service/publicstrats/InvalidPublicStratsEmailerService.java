package org.eupathdb.common.service.publicstrats;

import static org.gusdb.fgputil.FormatUtil.NL;
import static org.gusdb.fgputil.functional.Functions.binItems;
import static org.gusdb.fgputil.functional.Functions.reduce;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.functional.Functions;
import org.gusdb.wdk.model.Utilities;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.user.StepFactory;
import org.gusdb.wdk.model.user.Strategy;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONArray;
import org.json.JSONObject;

@Path("/invalid-public-strats-report")
public class InvalidPublicStratsEmailerService extends AbstractWdkService {

  private static final Logger LOG = Logger.getLogger(InvalidPublicStratsEmailerService.class);

  private static final String SITE_NAME_MACRO = "%%SITE_NAME%%";
  private static final String SITE_URL_MACRO = "%%SITE_URL%%";

  private static final String EMAIL_MESSAGE_SUBJECT =
      "Outdated public strategies on " + SITE_NAME_MACRO;

  private static final String EMAIL_MESSAGE_TEXT =
      "Due to data updates in a recent release, the following search strategies" +
      " you have set as 'public' have become outdated.  Other users will not" +
      " be able to see them in the Public tab, nor will bookmarked links to" +
      " these strategies provide meaningful results, until they are revised." +
      NL + NL +
      "Please log in to " + SITE_URL_MACRO + ", visit each of the links" +
      " below, and revise any steps covered by a red 'X'.  You may also" +
      " unpublish a strategy by clicking its ‘Public’ checkbox." +
      NL + NL;

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Response notifyInvalidPublicStratsOwners(
      @QueryParam("sendEmailToUsers") @DefaultValue("false") boolean sendEmail,
      @QueryParam("logEmailContent") @DefaultValue("false") boolean logEmailContent,
      @QueryParam("statsOnly") @DefaultValue("false") boolean statsOnly
  ) throws WdkModelException {
    WdkModel model = getWdkModel();

    if (!model.getModelConfig().getAdminEmails().contains(getRequestingUser().getEmail())) {
      return Response.status(Status.UNAUTHORIZED).build();
    }

    // valid admin user creds submitted, load public strats and sort by owner email
    Map<String, List<Strategy>> invalidStrats = binItems(
      new StepFactory(getRequestingUser()).getPublicStrategies(),
      str -> str.getOwningUser().getEmail(),
      Functions.not(Strategy::isValid)
    );

    // get relevant context info
    String smtpServer = model.getModelConfig().getSmtpServer();
    String supportEmail = model.getModelConfig().getSupportEmail();
    String siteName = model.getDisplayName();
    URI baseUri = getUriInfo().getBaseUri();
    String localhost = baseUri.getScheme() + "://" + baseUri.getHost();
    String webappPath = model.getProperties().get("WEBAPP_BASE_URL");
    String strategyLinkPrefix = localhost + webappPath + "/workspace/strategies/";

    // send one email per user detailing their strats' issues and build response
    Function<String,String> replace = str -> str
        .replace(SITE_NAME_MACRO, siteName)
        .replace(SITE_URL_MACRO, localhost);
    String subject = replace.apply(EMAIL_MESSAGE_SUBJECT);
    String messageText = replace.apply(EMAIL_MESSAGE_TEXT);

    // will return either:
    //   1. statistics object (num users, num strats)
    //   2. an array of objects; one for each user, containing invalid strat info
    JSONArray ownersArray = new JSONArray();

    for (String userEmail : invalidStrats.keySet()) {

      List<Strategy> strats = invalidStrats.get(userEmail);
      long userId = strats.get(0).getOwningUser().getUserId();
      JSONArray stratJsons = new JSONArray();
      StringBuilder content = new StringBuilder(messageText);

      for (Strategy strat : strats) {
        String link = strategyLinkPrefix + strat.getStrategyId();
        stratJsons.put(new JSONObject()
          .put("id", strat.getStrategyId())
          .put("name", strat.getName())
          .put("link", link));
        content
          .append(strat.getName()).append(NL)
          .append(link).append(NL)
          .append(NL);
      }

      ownersArray.put(new JSONObject()
        .put("userId", userId)
        .put("siteName", siteName)
        .put("email", userEmail)
        .put("invalidPublicStrategies", stratJsons));

      if (logEmailContent) {
        LOG.info(
          "Sending email via '" + smtpServer + "'" + NL + NL +
          "To: " + userEmail + NL +
          "Reply-to: " + supportEmail + NL +
          "Subject: " + subject + NL + NL +
          content.toString() + NL
        );
      }

      if (sendEmail) {
        Utilities.sendEmail(
          smtpServer,
          userEmail,
          supportEmail,
          subject,
          content.toString(),
          ""
        );
      }
    }

    // build statistics
    JSONObject stats = getStatsObj(invalidStrats);

    return Response.ok((statsOnly ? stats :
      new JSONObject()
        .put("stats", stats)
        .put("details", ownersArray)
    ).toString(2)).build();
  }

  private JSONObject getStatsObj(Map<String, List<Strategy>> invalidStrats) {
    int numUniqueUsers = invalidStrats.size();
    List<Integer> numStratsPerUser = invalidStrats.values().stream()
        .map(list -> list.size()).collect(Collectors.toList());
    int numOverallStrats = numStratsPerUser.stream().mapToInt(i -> i).sum();
    JSONObject usersPerCount = reduce(binItems(numStratsPerUser, i -> i, val -> true).entrySet(),
        (json, bin) -> json.put(bin.getKey().toString(), bin.getValue().size()), new JSONObject());
    return new JSONObject()
        .put("totalUniqueUsers", numUniqueUsers)
        .put("totalStrategies", numOverallStrats)
        .put("distribution (num strats -> num users with that many strats)", usersPerCount);
  }

}
