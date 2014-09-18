package org.eupathdb.common.controller.functions;

import java.io.IOException;
import java.util.Properties;
import javax.servlet.ServletContext;
import org.apache.log4j.Logger;

public class AssetFunctions {

  private static final String PROPS_FILE = "/WEB-INF/assets-checksums.properties";
  private static final Logger logger = Logger.getLogger(AssetFunctions.class);
  private static Properties checksumProps = new Properties();
  private static boolean didAttemptToLoadProps = false;

  private static void loadChecksums(ServletContext svc) {
    if (!didAttemptToLoadProps) {
      try {
        checksumProps.load(svc.getResourceAsStream(PROPS_FILE));
      }
      catch (IOException ioe) {
        logger.error(ioe);
      }
      catch (NullPointerException npe) {
        logger.warn(PROPS_FILE + " not found. No URLs will be rewritten.");
        checksumProps = null;
      }
      finally {
        didAttemptToLoadProps = true;
      }
    }
  }

  public static String doFingerprint(String url, ServletContext svc) {
    loadChecksums(svc);
    if (checksumProps != null) {
      String checksum = checksumProps.getProperty(url);
      if (checksum != null) {
        Integer extIndex = url.lastIndexOf('.');
        String srcBase = url.substring(0, extIndex);
        String srcExt = url.substring(extIndex);
        url = srcBase + "-" + checksum + srcExt;
      }
    }
    return url;
  }
}
