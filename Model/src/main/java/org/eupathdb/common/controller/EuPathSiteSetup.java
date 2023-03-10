package org.eupathdb.common.controller;

import java.time.Duration;
import java.util.List;
import java.util.Properties;

import org.apache.log4j.Logger;
import org.eupathdb.common.errors.ErrorEmailThrottler;
import org.eupathdb.common.errors.ErrorHandler;
import org.eupathdb.common.errors.ErrorHandlerHelpers;
import org.eupathdb.common.errors.ErrorHandlerHelpers.ErrorCategory;
import org.gusdb.fgputil.events.EventListener;
import org.gusdb.fgputil.events.Events;
import org.gusdb.wdk.events.ErrorEvent;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkRuntimeException;

public class EuPathSiteSetup {
  private static final Logger LOG = Logger.getLogger(EuPathSiteSetup.class);
  private static final String WDK_PROP_EMAIL_BURST_THROTTLE_SIZE_KEY = "EMAIL_BURST_THROTTLE_SIZE";
  private static final String WDK_PROP_EMAIL_SUSTAINED_THROTTLE_KEY= "EMAIL_SUSTAINED_THROTTLE_RATE_PER_SECOND";
  private static final String DEFAULT_EMAIL_BURST_THROTTLE_SIZE = "500.0";
  private static final String DEFAULT_EMAIL_SUSTAINED_THROTTLE_RATE = Double.toString(1.0 / Duration.ofMinutes(10).getSeconds());

  /**
   * Initialize any parts of the ApiCommon web application not handled by normal
   * WDK initialization.
   * 
   * @param wdkModel initialized WDK model
   */
  public static void initialize(WdkModel wdkModel) {
    addErrorListener(wdkModel);
  }

  /**
   * Registers a listener to receive error events that passes their contents to a global error handler
   */
  private static void addErrorListener(WdkModel wdkModel) {
    try {
      // only load filters once from disk
      Properties filters = ErrorHandlerHelpers.loadErrorFilters();
      List<ErrorCategory> categories = ErrorHandlerHelpers.loadErrorCategories();
      ErrorEmailThrottler errorEmailThrottler = new ErrorEmailThrottler(wdkModel);
      EventListener listener = event -> {
        ErrorEvent error = (ErrorEvent)event;
        new ErrorHandler(filters, categories, errorEmailThrottler).handleError(error.getErrorBundle(), error.getErrorContext());
      };
      Events.subscribe(listener, ErrorEvent.class);
    }
    catch (Exception e) {
      String message = "Could not load error email filters or categories.";
      LOG.error(message, e);
      throw new WdkRuntimeException(message, e);
    }
  }
}
