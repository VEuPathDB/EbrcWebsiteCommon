package org.eupathdb.common.service;

/**
 * This service's goal is to replicate the old ProcessRESTAction API; that is:
 * 
 * A set of endpoints that support GET requests to return either xml or json
 * reporter data.  Parameters to build the answer spec are passed via query
 * params in the URL.  Filters of any kind are not supported.  It also supports
 * wadl generation to declare the params of each question.  See functionality
 * of ProcessRESTAction.java in trunk prior to the strategy-loading branch
 * reintegration merge, or on api-build-43 (maybe 44/45 too).
 * 
 * Old struts-config information:
 *
 *  <!-- * is question set name -->
 *  <action
 *       path="/*.wadl"
 *       type="org.gusdb.wdk.controller.action.services.ProcessRESTAction"
 *       scope="request"
 *       validate="false"
 *       parameter="{1}.all::wadl"/>
 *
 *   <!--
 *       {1} question set name
 *       {2} question name; if the name is "all" & {3} is wadl, it's equivalent to the action above.
 *       {3} json|xml|wadl
 *    -->
 *  <action
 *       path="/* /*.*" <-- put space here to protect javadoc
 *       type="org.gusdb.wdk.controller.action.services.ProcessRESTAction"
 *       scope="request"
 *       validate="false"
 *       parameter="{1}.{2}::{3}"/>
 *
 * @author rdoherty
 */
public class LegacyDownloadService {

}
