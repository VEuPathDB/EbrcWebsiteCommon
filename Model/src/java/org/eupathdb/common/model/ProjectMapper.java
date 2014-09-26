package org.eupathdb.common.model;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

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
   * @param wdkModel
   * @return
   */
  public synchronized static ProjectMapper getMapper(WdkModel wdkModel)
      throws WdkModelException {
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
  /**
   * a <projectId:site> map
   */
  private final Map<String, String> projects;

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
    this.projects = new LinkedHashMap<>();
    this.organisms = new HashMap<>();
    this.timeout = 0;
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
      String site = node.getAttribute("site");
      if (!site.endsWith("/"))
        site += "/";

      projects.put(name, site);
    }

    // get this mapper's project and local URL
    String projectId = wdkModel.getProjectId();
    String myUrl = wdkModel.getModelConfig().getWebAppUrl();

    // site URL in modelConfig for this project overrides any in projects.xml
    projects.put(projectId, myUrl);
  }

  /**
   * timeout, in seconds, for accessing the web service for one component.
   * @return
   */
  public long getTimeout() {
    return timeout;
  }

  public String getRecordUrl(String recordClass, String projectId,
      String sourceId) throws UnsupportedEncodingException {
    String site = getSite(projectId);

    projectId = URLEncoder.encode(projectId, "UTF-8");
    sourceId = URLEncoder.encode(sourceId, "UTF-8");
    return site + "showRecord.do?name=" + recordClass + "&project_id="
        + projectId + "&source_id=" + sourceId;
  }

  public String getWebServiceUrl(String projectId) {
    String site = getSite(projectId);
    return site + "services/WsfService";
  }
  
  public String getBaseUrl(String projectId) {
    String site = getSite(projectId);
    //if (site.length() == 0) return "";

    // remove the webapp from the url
    int pos = site.substring(0, site.length() - 1).lastIndexOf("/");
    return site.substring(0, pos);
  }

  protected String getSite(String projectId) {
    // get the site. if site doesn't exist, use the current site
    String site = projects.get(projectId);
    return (site == null) ? "" : site;
  }
  
  public Collection<String> getAllProjects() {
    return projects.keySet();
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
    ResultSet resultSet = null;
    try {
      PreparedStatement ps = SqlUtils.getPreparedStatement(dataSource, sql);
      ps.setString(1, organism);
      resultSet = ps.executeQuery();
      String projectId = null;
      if (resultSet.next())
        projectId = resultSet.getString("project_id");

      // if no project is found, put null into the mapping.
      organisms.put(organism, projectId);
      return projectId;
    } finally {
      SqlUtils.closeResultSetAndStatement(resultSet);
    }
  }
}
