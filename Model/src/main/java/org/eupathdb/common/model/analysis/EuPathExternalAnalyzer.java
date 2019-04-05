package org.eupathdb.common.model.analysis;

import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.analysis.ExternalAnalyzer;
import org.json.JSONObject;

/**
 * This analyzer is a customized version of the WDK analyzer. It additionally relays, in the view model, the
 * name of project folder that is used to complete the data storage directory address.
 */
public class EuPathExternalAnalyzer extends ExternalAnalyzer {

  /**
   * Override so as to accommodate the additional project folder parameter and in so doing making it available
   * to the custom analysis results page requiring it. For security reasons the project folder is relayed
   * rather than the entire absolute path of the data storage dir.
   * 
   * @author crisl-adm
   */
  public static class ViewModel extends ExternalAnalyzer.ViewModel {

    private String _projectFolder;

    public ViewModel(String iframeBaseUrl, int width, int height, String projectFolder) {
      super(iframeBaseUrl, width, height);
      _projectFolder = projectFolder;
    }

    public String getProjectFolder() {
      return _projectFolder;
    }

    @Override
    public JSONObject toJson() {
      return super.toJson().put("projectFolder", _projectFolder);
    }

  }

  private ViewModel createResultViewModel() {
    String dataStorageDir = getWdkModel().getStepAnalysisPlugins().getExecutionConfig().getFileStoreDirectory();
    return new ViewModel(getProperty(EXTERNAL_APP_URL_PROP_KEY),
        chooseSize(IFRAME_WIDTH_PROP_KEY, DEFAULT_IFRAME_WIDTH_PX),
        chooseSize(IFRAME_LENGTH_PROP_KEY, DEFAULT_IFRAME_HEIGHT_PX),
        dataStorageDir.substring(dataStorageDir.lastIndexOf('/') + 1));
  }

  @Override
  public JSONObject getResultViewModelJson() throws WdkModelException {
    return createResultViewModel().toJson();
  }

}
