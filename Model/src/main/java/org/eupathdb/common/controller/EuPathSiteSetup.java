package org.eupathdb.common.controller;

import java.io.IOException;
import java.util.Properties;

import org.eupathdb.common.errors.ErrorHandler;
import org.gusdb.fgputil.events.Event;
import org.gusdb.fgputil.events.EventListener;
import org.gusdb.fgputil.events.Events;
import org.gusdb.wdk.events.ErrorEvent;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkRuntimeException;

public class EuPathSiteSetup {

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
      final Properties filters = ErrorHandler.getErrorFilters();
      Events.subscribe(new EventListener() {
        @Override
        public void eventTriggered(Event event) throws Exception {
          ErrorEvent error = (ErrorEvent)event;
          new ErrorHandler(error.getErrorBundle(), error.getErrorContext(), filters).handleError();
        }
      }, ErrorEvent.class);
    }
    catch (IOException e) {
      throw new WdkRuntimeException("Could not load error email filters.", e);
    }
  }
}
