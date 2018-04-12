package org.eupathdb.common.model.attribute;

import org.gusdb.fgputil.ArrayUtil;
import org.gusdb.wdk.model.record.attribute.plugin.WordCloudAttributePlugin;

public class EuPathWordCloudAttributePlugin extends WordCloudAttributePlugin {

  private static String[] SUPPLEMENTAL_COMMON_WORDS = {
      "off", "cgi", "bin", "groupac", "href", "http", "org", "tmp",
      "chro", "sequencelist", "orthomcl", "orthomclweb"
  };

  @Override
  protected String[] getCommonWords() {
    return ArrayUtil.concatenate(COMMON_WORDS, SUPPLEMENTAL_COMMON_WORDS);
  }

}
