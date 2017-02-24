package org.eupathdb.common.controller;

import java.util.List;
import java.util.Properties;

import org.apache.log4j.Logger;
import org.eupathdb.common.errors.ErrorHandler;
import org.eupathdb.common.errors.ErrorHandlerHelpers;
import org.eupathdb.common.errors.ErrorHandlerHelpers.ErrorCategory;
import org.gusdb.fgputil.events.Event;
import org.gusdb.fgputil.events.EventListener;
import org.gusdb.fgputil.events.Events;
import org.gusdb.wdk.events.ErrorEvent;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkRuntimeException;

public class EuPathSiteSetup {

  private static final Logger LOG = Logger.getLogger(EuPathSiteSetup.class);

  /**
   * Initialize any parts of the ApiCommon web application not handled by normal
   * WDK initialization.
   * 
   * @param wdkModel initialized WDK model
   */
  public static void initialize(WdkModel wdkModel) {
    addErrorListener();
  }

  /**
   * Registers a listener to receive error events that passes their contents to a global error handler
   */
  private static void addErrorListener() {
    try {
      // only load filters once from disk
      final Properties filters = ErrorHandlerHelpers.loadErrorFilters();
      final List<ErrorCategory> categories = ErrorHandlerHelpers.loadErrorCategories();
      Events.subscribe(new EventListener() {
        @Override
        public void eventTriggered(Event event) throws Exception {
          ErrorEvent error = (ErrorEvent)event;
          new ErrorHandler(filters, categories).handleError(error.getErrorBundle(), error.getErrorContext());
        }
      }, ErrorEvent.class);
    }
    catch (Exception e) {
      String message = "Could not load error email filters or categories.";
      LOG.error(message, e);
      throw new WdkRuntimeException(message, e);
    }
  }
}
