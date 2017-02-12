package org.eupathdb.common.model.ontology;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.gusdb.fgputil.functional.TreeNode;
import org.gusdb.fgputil.functional.TreeNode.StructureMapper;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.ontology.OntologyNode;
import org.apache.log4j.Logger;

public class SiteMapOntologyPlugin extends EuPathDbOwlParserWdkPlugin {

  private static final Logger logger = Logger.getLogger(SiteMapOntologyPlugin.class);
  private static final boolean DEBUG = false;

  @Override
  public TreeNode<OntologyNode> getTree(Map<String, String> parameters, String ontologyName)
      throws WdkModelException {

    TreeNode<OntologyNode> tree = super.getTree(parameters, ontologyName);
    TreeNode<OntologyNode> siteMapTree = tree.mapStructure(new SiteMapMapper());

    return siteMapTree;
  }

  private class SiteMapMapper implements StructureMapper<OntologyNode, TreeNode<OntologyNode>> {

    /*
     * SiteMapMapper(List<Map<String, SearchCategory>> maps) { this.maps = maps; }
     */

    @Override
    public TreeNode<OntologyNode> map(OntologyNode nodeContents,
        List<TreeNode<OntologyNode>> mappedChildren) {

      TreeNode<OntologyNode> newNode = new TreeNode<OntologyNode>(nodeContents);
      String parentLabel = "unknown";
      if (nodeContents.get("label") != null) parentLabel = nodeContents.get("label").get(0);
      
      // a sub-category node that will hold tracks, if any
      TreeNode<OntologyNode> trackSubCategory = makeCategoryNode("Tracks", "Genome browser tracks", new Integer(1), parentLabel+"-tracks");
      
      // 
      Map<String, RecordSubCategory> recordSubCategories = new HashMap<String, RecordSubCategory>();

      if (DEBUG) {
	if ( nodeContents.get("EuPathDB alternative term") != null && nodeContents.get("EuPathDB alternative term").get(0).equals("Gene models"))
	  logger.info("------------------" + nodeContents.get("EuPathDB alternative term"));
      }
      
      boolean isTopLevel = false;  // a hack to hide top level individuals
      for (TreeNode<OntologyNode> child : mappedChildren) {
        
	isTopLevel |= child.getContents().get("EuPathDB alternative term") != null && child.getContents().get("EuPathDB alternative term").get(0).equals("Gene models");

        // a category - just add to parent
         if (child.getChildNodes().size() !=  0) {
           newNode.addChildNode(child);
         } 
         
         // an individual - put into new sub-categories
         else if (child.getContents().containsKey("scope") && child.getContents().containsKey("targetType")) {
           List<String> targetType = child.getContents().get("targetType");
           List<String> scope = child.getContents().get("scope");
           
           // if the individual has a recordClassName, parse out the displayable part (eg, "Gene")
           // and give it to the individual as a new property 
           String recordName = setNodeRecordClassDisplayName(child.getContents());
	   if (DEBUG) {
	     if ( nodeContents.get("EuPathDB alternative term") != null && nodeContents.get("EuPathDB alternative term").get(0).equals("Gene models")) if (recordName != null) logger.info("*************************** record name: " + recordName);
           }

           // if a track, add into that sub category
           if (targetType.contains("track")) {
             trackSubCategory.addChildNode(child);
           } 
           
           // if a wdk entity, add into a sub category based on its record class name
           else if (scope.contains("menu")) {
             RecordSubCategory subCat = initRecordSubCategory(recordName, recordSubCategories, parentLabel);
             subCat.menu.addChildNode(child);
           } else if (scope.contains("result")) {
             RecordSubCategory subCat = initRecordSubCategory(recordName, recordSubCategories, parentLabel);
             subCat.result.addChildNode(child);
           } else if (scope.contains("record")) {
             RecordSubCategory subCat = initRecordSubCategory(recordName, recordSubCategories, parentLabel);
             subCat.record.addChildNode(child);
           }
         }        
      }
      
      // now add in our synthetic categories
      if (isTopLevel) return newNode;   // don't bother if we are in the very top level

      if (trackSubCategory.getChildNodes().size() != 0) newNode.addChildNode(trackSubCategory);

      // order of record class subcats is alphabetical, starting after track sub cat (if any)
      int order = 2; 
      for (String className : new TreeSet<String>(recordSubCategories.keySet())) {
	if (DEBUG) {
	  if ( nodeContents.get("EuPathDB alternative term") != null && nodeContents.get("EuPathDB alternative term").get(0).equals("Gene models")) logger.info("=========== adding " + className);
	}

        RecordSubCategory recordSubCat = recordSubCategories.get(className);
        recordSubCat.addToParent(newNode, order++);
      }

      if (DEBUG) {
	if ( nodeContents.get("EuPathDB alternative term") != null && nodeContents.get("EuPathDB alternative term").get(0).equals("Gene models")) logger.info(newNode.toString());
      }
      return newNode;
    }    
  }
  
  private RecordSubCategory initRecordSubCategory(String recordName, Map<String, RecordSubCategory> recordSubCategories, String parentLabel) {
    if (!recordSubCategories.containsKey(recordName)) {
      recordSubCategories.put(recordName, new RecordSubCategory(recordName, parentLabel));
    }
    return recordSubCategories.get(recordName);
  }
  
  /**
   * If the input nodeContents contains a recordClassName, parse it to derive a display name for the record class.
   * Set that property in the node contents, and return it.
   * @param nodeContents
   * @return record class display name, or null if none
   */
  private String setNodeRecordClassDisplayName(OntologyNode nodeContents) {
    String n = null;
    if (nodeContents.containsKey("recordClassName")) {
      String rcn = nodeContents.get("recordClassName").get(0);
      Pattern pattern = Pattern.compile("(.*)RecordClasses");
      Matcher matcher = pattern.matcher(rcn);
      if (matcher.find()) n = matcher.group(1);  
      if (n.equals("Transcript")) n = "Gene";
      if (n.equals("DynSpan")) n = "Genomic Segment";
      if (n.equals("Sequence")) n = "Genomic Sequence";
      ArrayList<String> names = new ArrayList<String>();
      names.add(n);
      nodeContents.put("recordClassDisplayName", names);
    }
    return n;
  }
  
  private TreeNode<OntologyNode> makeCategoryNode(String displayName, String description, int order, String label) {
    OntologyNode nodeContents = new OntologyNode();
    TreeNode<OntologyNode> node = new TreeNode<OntologyNode>(nodeContents);

    ArrayList<String> labels = new ArrayList<String>();
    labels.add(label);
    nodeContents.put("label", labels);

    // a flag to tell client these are special to site map
    ArrayList<String> sms = new ArrayList<String>();
    sms.add("true");
    nodeContents.put("SiteMapSpecial", sms);

    ArrayList<String> names = new ArrayList<String>();
    names.add(displayName);
    nodeContents.put("EuPathDB alternative term", names);
 
    ArrayList<String> descs = new ArrayList<String>();
    descs.add(description);
    nodeContents.put("definition", descs);

    ArrayList<String> orders = new ArrayList<String>();
    orders.add(new Integer(order).toString());
    nodeContents.put("display order", orders);

    return node;
  }
  
  private class RecordSubCategory {
    private String recordName;
    private String label;
    private TreeNode<OntologyNode> recordCatNode = null;  // the node that will hold this record sub category
    TreeNode<OntologyNode> menu;
    TreeNode<OntologyNode> record;
    TreeNode<OntologyNode> result;
    
    RecordSubCategory(String name, String parentLabel) {
      recordName = name;
      label = parentLabel + "-" + recordName;
      menu = makeCategoryNode("Searches", "Searches", 1, label + "-menu");
      record = makeCategoryNode("Record pages", "Record pages", 2, label + "-record");
      result = makeCategoryNode("Search Results", "Search results", 3, label + "-result");
    }

    void addToParent(TreeNode<OntologyNode> parent, int order) {

      if (recordCatNode == null) {
	recordCatNode = makeCategoryNode(recordName + " Records", "Components related to " + recordName + " records", order, label);
	parent.addChildNode(recordCatNode);
      }

      if (menu.getChildNodes().size() != 0) recordCatNode.addChildNode(menu);
      if (record.getChildNodes().size() != 0) recordCatNode.addChildNode(record);
      if (result.getChildNodes().size() != 0) recordCatNode.addChildNode(result);
    }
  }
}
