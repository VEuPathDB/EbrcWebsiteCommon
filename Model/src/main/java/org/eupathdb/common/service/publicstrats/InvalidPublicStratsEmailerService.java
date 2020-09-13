package org.eupathdb.common.service.publicstrats;

import static org.gusdb.fgputil.FormatUtil.NL;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Predicate;

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
import org.gusdb.wdk.model.user.Strategy;
import org.gusdb.wdk.service.service.AbstractWdkService;
import org.json.JSONArray;
import org.json.JSONObject;

@Path("/invalid-public-strats-notification")
public class InvalidPublicStratsEmailerService extends AbstractWdkService {

  private static final Logger LOG = Logger.getLogger(InvalidPublicStratsEmailerService.class);

  private static final boolean TEST = true;

  private static final String AUTH_CODE_HEADER = "auth-code";

  private static final String SITE_NAME_MACRO = "%%SITE_NAME%%";
  private static final String SITE_URL_MACRO = "%%SITE_URL%%";

  private static final String EMAIL_MESSAGE_SUBJECT =
      "Invalid public strategies on " + SITE_NAME_MACRO;

  private static final String EMAIL_MESSAGE_TEXT =
      "Due to changes in a recent release, the following search strategies" +
      " you have set as 'public' have become invalid.  Other users will not" +
      " be able to see them in the Public tab until they are revised. " +
      NL + NL +
      "Please log in to " + SITE_URL_MACRO + ", visit each of the links" +
      " below, and revise any steps covered by a red 'X'.  You may also" +
      " unpublish a strategy by clicking its ‘Public’ checkbox." +
      NL + NL;

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Response notifyInvalidPublicStratsOwners(
      @QueryParam("sendEmail") @DefaultValue("false") boolean sendEmail
  ) throws WdkModelException {
    if (!adminCredentialsSubmitted()) {
      return Response.status(Status.UNAUTHORIZED).build();
    }

    // valid admin user creds submitted, load public strats and sort by owner email
    WdkModel model = getWdkModel();
    Map<String, List<Strategy>> invalidStrats = binItems(
      model.getStepFactory().getPublicStrategies(),
      str -> str.getUser().getEmail(),
      Functions.not(Strategy::isValid)
    );

    // get relevant context info
    String smtpServer = model.getModelConfig().getSmtpServer();
    String supportEmail = model.getModelConfig().getSupportEmail();
    String siteName = model.getDisplayName();
    String localhost = model.getProperties().get("LOCALHOST");
    String webappPath = model.getProperties().get("WEBAPP_BASE_URL");
    String strategyLinkPrefix = localhost + webappPath + "/workspace/strategies/";

    // send one email per user detailing their strats' issues and build response
    Function<String,String> replace = str -> str
        .replace(SITE_NAME_MACRO, siteName)
        .replace(SITE_URL_MACRO, localhost);
    String subject = replace.apply(EMAIL_MESSAGE_SUBJECT);
    String messageText = replace.apply(EMAIL_MESSAGE_TEXT);

    // will return an array of objects; one for each user, containing invalid strat info
    JSONArray responseJson = new JSONArray();

    for (String userEmail : invalidStrats.keySet()) {

      List<Strategy> strats = invalidStrats.get(userEmail);
      long userId = strats.get(0).getUser().getUserId();
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

      responseJson.put(new JSONObject()
        .put("userId", userId)
        .put("email", userEmail)
        .put("invalidPublicStrategies", stratJsons));

      if (TEST) {
        LOG.info(
          "Sending email via '" + smtpServer + "'" + NL + NL +
          "To: " + userEmail + NL +
          "Cc: " + supportEmail + NL +
          "Reply-to: " + supportEmail + NL +
          "Subject: " + subject + NL + NL +
          content.toString() + NL
        );
      }
      else if (sendEmail) {
        Utilities.sendEmail(
          smtpServer,
          userEmail,
          supportEmail,
          subject,
          content.toString(),
          supportEmail
        );
      }
    }

    return Response.ok(responseJson.toString(2)).build();
  }

  private boolean adminCredentialsSubmitted() throws WdkModelException {
    List<String> authHeaders = getHeaders().get(AUTH_CODE_HEADER);
    String[] loginCreds;
    if (authHeaders == null || authHeaders.isEmpty() || authHeaders.get(0) == null ||
        (loginCreds = authHeaders.get(0).split("\\|", 2)).length == 1) {
      return false;
    }
    return
      getWdkModel().getUserFactory().isCorrectPassword(loginCreds[0], loginCreds[1]) &&
      getWdkModel().getModelConfig().getAdminEmails().contains(loginCreds[0]);
  }

  private static <S,T> Map<S,List<T>> binItems(Collection<T> items,
      Function<T,S> getCharacteristicFunction, Predicate<T> test) {
    return Functions.reduce(items, (acc, next) -> {
      if (test.test(next)) {
        S key = getCharacteristicFunction.apply(next);
        List<T> bin = acc.get(key);
        if (bin == null) {
          bin = new ArrayList<>();
          acc.put(key, bin);
        }
        bin.add(next);
      }
      return acc;
    }, new LinkedHashMap<S,List<T>>());
  }
}
