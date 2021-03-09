package org.eupathdb.common.model;

import java.util.Map;
import java.util.function.Function;

import org.gusdb.fgputil.Tuples.TwoTuple;
import org.gusdb.fgputil.web.LoginCookieFactory;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.user.User;

public class MultiBlastServiceUtil {

  // required properties in model.prop
  private static final String LOCALHOST_PROP_KEY = "LOCALHOST";
  private static final String SERVICE_URL_PROP_KEY = "MULTI_BLAST_SERVICE_URL";

  // header name for blast service authentication
  private static final String AUTH_HEADER_NAME = "Auth-Key";

  public static <T extends Exception> String getMultiBlastServiceUrl(WdkModel model, Function<String,T> exceptionProvider) throws T {
    Map<String,String> modelProps = model.getProperties();
    String localhost = modelProps.get(LOCALHOST_PROP_KEY);
    String multiBlastServiceUrl = modelProps.get(SERVICE_URL_PROP_KEY);
    if (localhost == null || multiBlastServiceUrl == null) {
      throw exceptionProvider.apply("model.prop must contain the properties: " +
          LOCALHOST_PROP_KEY + ", " + SERVICE_URL_PROP_KEY);
    }
    return localhost + multiBlastServiceUrl;
  }

  public static TwoTuple<String,String> getAuthHeader(WdkModel wdkModel, User user) {
    return user.isGuest()
        ? new TwoTuple<>(
            AUTH_HEADER_NAME,
            String.valueOf(user.getUserId()))
        : new TwoTuple<>(
            AUTH_HEADER_NAME,
            new LoginCookieFactory(wdkModel.getModelConfig().getSecretKey()).getLoginCookieValue(user.getEmail()));
  }

}
