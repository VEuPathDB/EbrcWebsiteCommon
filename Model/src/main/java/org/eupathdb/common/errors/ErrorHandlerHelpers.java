package org.eupathdb.common.errors;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.FormatUtil;
import org.gusdb.fgputil.json.JsonIterators;
import org.gusdb.fgputil.json.JsonType;
import org.gusdb.fgputil.json.JsonType.ValueType;
import org.gusdb.fgputil.json.JsonUtil;
import org.gusdb.fgputil.runtime.GusHome;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ErrorHandlerHelpers {

  private static final Logger LOG = Logger.getLogger(ErrorHandlerHelpers.class);

  // files defining error filters and categories (relative to gus_home)
  private static final String ERROR_CONFIG_DIR = "data/EuPathSiteCommon/Model/errors/";
  private static final String FILTER_FILE = ERROR_CONFIG_DIR + "wdkErrorFilters.txt";
  private static final String CATEGORY_FILE = ERROR_CONFIG_DIR + "wdkErrorCategories.txt";

  public static final String REDMINE_LINK_PREFIX = "https://redmine.apidb.org/issues/";

  private ErrorHandlerHelpers() { }

  public static class ErrorCategory {

    private final List<String> _matchStrings;
    private final String _comment;
    private final Integer _redmineIssue;
    private final boolean _isFixed;
    private final boolean _isEmailWorthy;

    public ErrorCategory(List<String> matchStrings, String comment, Integer redmineIssue, boolean isFixed, boolean isEmailWorthy) {
      _matchStrings = matchStrings;
      _comment = comment;
      _redmineIssue = redmineIssue;
      _isFixed = isFixed;
      _isEmailWorthy = isEmailWorthy;
    }

    public List<String> getMatchStrings() { return _matchStrings; }
    public String getComment() { return _comment; }
    public Integer getRedmineIssue() { return _redmineIssue; }
    public boolean isEmailWorthy() { return _isEmailWorthy; }
    public boolean isFixed() { return _isFixed; }

  }

  /**
   * Loads filters from config file into Properties object
   * 
   * @param context
   *          context to use to fetch resource
   * @return properties object containing filters
   * @throws IOException
   *           if unable to load filters
   */
  public static Properties loadErrorFilters() throws IOException {
    Path filterFile = Paths.get(GusHome.getGusHome(), FILTER_FILE);
    Properties filters = new Properties();
    try (InputStream is = new FileInputStream(filterFile.toFile())) {
      filters.load(is);
    }
    return filters;
  }

  public static List<ErrorCategory> loadErrorCategories() throws IOException {
    Path categoryFile = Paths.get(GusHome.getGusHome(), CATEGORY_FILE);
    List<ErrorCategory> categories = new ArrayList<>();
    StringBuilder inJsonStr = new StringBuilder();
    try (BufferedReader br = new BufferedReader(new FileReader(categoryFile.toFile()))) {
      while (br.ready()) {
        inJsonStr.append(br.readLine().trim());
      }
    }
    for (JsonType categoryJson : JsonIterators.arrayIterable(new JSONArray(inJsonStr.toString()))) {
      if (!categoryJson.getType().equals(ValueType.OBJECT)) {
        LOG.warn("Error category file: array contains value that is not a JSON object (skipping): " + categoryJson.toString());
        continue;
      }
      JSONObject category = categoryJson.getJSONObject();
      try {
        JSONArray matchStringArray = category.getJSONArray("matchStrings");
        List<String> matchStrings = new ArrayList<>();
        for (JsonType matchStringJson : JsonIterators.arrayIterable(matchStringArray)) {
          if (!matchStringJson.getType().equals(ValueType.STRING)) {
            LOG.warn("Error category file: match string array contains non-string (skipping): " + matchStringJson.toString());
            continue;
          }
          matchStrings.add(matchStringJson.getString());
        }
        if (matchStrings.isEmpty()) {
          LOG.warn("Error category file: category contains no more valid match strings (skipping); " + matchStringArray.toString());
          continue;
        }
        String comment = JsonUtil.getStringOrDefault(category, "comment", "");
        Integer redmineIssue = JsonUtil.getIntegerOrDefault(category, "redmine", -1);
        if (redmineIssue == -1) redmineIssue = null; // convert to null if not present
        boolean isFixed = JsonUtil.getBooleanOrDefault(category, "isFixed", false);
        boolean isEmailWorthy = JsonUtil.getBooleanOrDefault(category, "emailWorthy", false);
        categories.add(new ErrorCategory(matchStrings, comment, redmineIssue, isFixed, isEmailWorthy));
      }
      catch (JSONException e) {
        LOG.warn("Error category file: category has property of the wrong type", e);
        continue;
      }
    }
    return categories;
  }

  /*************************** Utility classes, functions ***************************/

  /**
   * Converts an arbitrary type to a string with the assistance of a qualifier
   * 
   * @param <T>
   *          type of value being stringified
   */
  static class Stringifier<T> {
    /**
     * @param value
     *          value to be stringified
     * @param qualifier
     *          indicator to help stringify
     */
    public String stringify(T value, String qualifier) {
      return value.toString();
    }
  }

  static String valueOrDefault(String value, String defaultValue) {
    return (value == null ? defaultValue : value);
  }

  static <T> String getAttributeMapText(Map<String, T> attributeMap) {
    return getAttributeMapText(attributeMap, new Stringifier<T>());
  }

  static <T> String getAttributeMapText(Map<String, T> attributeMap, Stringifier<T> stringifier) {
    StringBuilder sb = new StringBuilder();
    for (String key : attributeMap.keySet()) {
      sb.append(key + " = " + stringifier.stringify(attributeMap.get(key), key) + FormatUtil.NL);
    }
    return sb.toString();
  }
}
