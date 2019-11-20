package org.eupathdb.common.controller;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.gusdb.fgputil.web.servlet.HttpServletApplicationContext;
import org.gusdb.wdk.controller.WdkInitializer;
import org.gusdb.wdk.model.WdkModel;

/**
 * A class that is initialized at the start of the web application. This makes
 * sure global resources are available to all the contexts that need them.
 */
public class ApplicationInitListener implements ServletContextListener {

  @Override
  public void contextInitialized(ServletContextEvent sce) {
    var context = new HttpServletApplicationContext(sce.getServletContext());
    WdkInitializer.initializeWdk(context);
    WdkModel wdkModel = WdkInitializer.getWdkModel(context);
    EuPathSiteSetup.initialize(wdkModel);
  }

  @Override
  public void contextDestroyed(ServletContextEvent sce) {
    WdkInitializer.terminateWdk(new HttpServletApplicationContext(sce.getServletContext()));
  }
}

