package org.eupathdb.common.model;

import java.io.File;
import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import javax.sql.DataSource;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.gusdb.fgputil.FormatUtil;
import org.gusdb.fgputil.db.SqlUtils;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 * The project mapper is used to load a mapping from project -> base URL of all
 * projects EuPathDB may need to contact.  It also provides functionality to
 * figure out which project an organism "belongs" to.
 * 
 * @author jerric
 */
public class ProjectMapper {

  private static final String PROJECTS_FILE = "projects.xml";

  private static Map<WdkModel, ProjectMapper> projectMappers = new HashMap<>();

  /**
   * Use this method to make sure we create a singleton mapper for every given
   * model, and to cache the mapper.
   * 
   * @param wdkModel model for which to fetch mapper
   * @return mapper for the passed model
   * @throws WdkModelException if unable to create mapper for this model
   */
  public static ProjectMapper getMapper(WdkModel wdkModel) throws WdkModelException {
    if (projectMappers.containsKey(wdkModel))
      return projectMappers.get(wdkModel);
    return addMapperForModel(wdkModel);
  }

  private synchronized static ProjectMapper addMapperForModel(WdkModel wdkModel)
      throws WdkModelException {
    // still need to check if mapper exists for this model
    ProjectMapper mapper = projectMappers.get(wdkModel);
    if (mapper == null) {
      mapper = new ProjectMapper(wdkModel);
      try {
        mapper.initialize();
        projectMappers.put(wdkModel, mapper);
      }
      catch (SAXException | IOException | ParserConfigurationException ex) {
        throw new WdkModelException(ex);
      }
    }
    return mapper;
  }

  private final WdkModel wdkModel;
  private final String myProjectId;
  private final String myWebAppUrl;
  private final String myWebSvcUrl;

  /**
   * a <projectId:site> map
   */
  private final Map<String, String> federatedProjects;

  /**
   * a lazy-loaded <organism:projectId> map
   */
  private final Map<String, String> organisms;

  /**
   * The timeout limit, in seconds, for accessing each component's web services.
   */
  private long timeout;

  protected ProjectMapper(WdkModel wdkModel)  {
    this.wdkModel = wdkModel;
    myProjectId = wdkModel.getProjectId();
    myWebAppUrl = addSlash(wdkModel.getModelConfig().getWebAppUrl());
    myWebSvcUrl = wdkModel.getModelConfig().getWebServiceUrl();
    federatedProjects = new LinkedHashMap<>();
    organisms = new HashMap<>();
    timeout = 0;
  }

  protected void initialize() throws WdkModelException, SAXException,
      IOException, ParserConfigurationException {
    
    // check if project config exists
    File projectsFile = new File(wdkModel.getGusHome() + "/config/" + PROJECTS_FILE);
    if (!projectsFile.exists())
      throw new WdkModelException("The project config file doesn't exist: "
          + projectsFile.getAbsolutePath());

    // read the config file
    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
    Document document = factory.newDocumentBuilder().parse(projectsFile);
    Element root = document.getDocumentElement();

    // read timeout if exists
    String strTimeout = root.getAttribute("timeout");
    if (strTimeout != null)
    timeout = Long.valueOf(strTimeout);

    // read projects
    NodeList nodes = document.getElementsByTagName("project");
    for (int i = 0; i < nodes.getLength(); i++) {
      Element node = (Element) nodes.item(i);
      String name = node.getAttribute("name");
      String site = addSlash(node.getAttribute("site"));
      federatedProjects.put(name, site);
    }
  }

  private static String addSlash(String str) {
    return (str.endsWith("/") ? str : str + "/");
  }

  /**
   * timeout, in seconds, for accessing the web service for one component.
   * @return
   */
  public long getTimeout() {
    return timeout;
  }

  public String getRecordUrl(String recordClass, String projectId,
      String sourceId) {
    String site = getWebAppUrl(projectId);
    projectId = FormatUtil.getUtf8EncodedString(projectId);
    sourceId = FormatUtil.getUtf8EncodedString(sourceId);
    return site + "showRecord.do?name=" + recordClass + "&project_id="
        + projectId + "&source_id=" + sourceId;
  }

  /**
   * Special URL for transcript record
   * 
   * @param recordClass
   * @param projectId
   * @param sourceId
   * @param geneSourceId
   * @return
   */
  public String getRecordUrl(String recordClass, String projectId,
      String sourceId, String geneSourceId) {
    String site = getWebAppUrl(projectId);
    geneSourceId = FormatUtil.getUtf8EncodedString(geneSourceId);
    return site + "app/record/gene/" + geneSourceId;
  }

  public String getWebServiceUrl(String projectId) {
    if (projectId.equals(myProjectId)) return myWebSvcUrl;
    String site = getWebAppUrl(projectId);
    return (site == null ? myWebSvcUrl : site + "services/WsfService");
  }

  public String getWebAppUrl(String projectId) {
    // get the site. if site doesn't exist, use the current site
    if (projectId.equals(myProjectId)) return myWebAppUrl;
    String site = federatedProjects.get(projectId);
    return (site == null ? myWebAppUrl : site);
  }

  public String getBaseUrl(String projectId) {
    String site = getWebAppUrl(projectId);
    // remove the webapp from the url
    return site.substring(0, site.lastIndexOf("/", site.length() - 2));
  }

  public String getWebAppName(String projectId) {
    String site = getWebAppUrl(projectId);
    // remove the webapp from the url
    if (site.endsWith("/")) site = site.substring(0, site.length() -1);
    return site.substring(site.lastIndexOf("/") + 1);
  }

  public Set<String> getFederatedProjects() {
    return federatedProjects.keySet();
  }

  /**
   * @param organism
   * @return return projectId found by the organism. if no project id is found,
   *         return null instead.
   */
  public String getProjectByOrganism(String organism)
      throws SQLException {
    organism = organism.trim();
    // organism has been mapped before, return the project id.
    if (organisms.containsKey(organism))
      return organisms.get(organism);

    // organism-project hasn't been mapped, load mapping
    String sql = "SELECT cast(apidb.project_id(?) as varchar2(20)) as project_id FROM dual";
    DataSource dataSource = wdkModel.getAppDb().getDataSource();
    PreparedStatement ps = null;
    ResultSet resultSet = null;
    try {
      ps = SqlUtils.getPreparedStatement(dataSource, sql);
      ps.setString(1, organism);
      resultSet = ps.executeQuery();
      String projectId = null;
      if (resultSet.next())
        projectId = resultSet.getString("project_id");

      // if no project is found, put null into the mapping.
      organisms.put(organism, projectId);
      return projectId;
    }
    finally {
      SqlUtils.closeResultSetAndStatement(resultSet, ps);
    }
  }
}
