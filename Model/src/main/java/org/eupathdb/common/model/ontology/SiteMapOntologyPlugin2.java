package org.eupathdb.common.model.ontology;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.functional.TreeNode;
import org.gusdb.fgputil.functional.TreeNode.StructureMapper;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.ontology.OntologyNode;

public class SiteMapOntologyPlugin2 extends EuPathDbOwlParserWdkPlugin {
  private static final Logger logger = Logger.getLogger(SiteMapOntologyPlugin.class);
  private static final boolean DEBUG = false;

  @Override
  public TreeNode<OntologyNode> getTree(Map<String, String> parameters, String ontologyName, WdkModel wdkModel)
      throws WdkModelException {

    TreeNode<OntologyNode> tree = super.getTree(parameters, ontologyName, wdkModel);
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

      // searches are ordered in the ontology
      Map<String, List<TreeNode<OntologyNode>>> searchesByRecord = new HashMap<String, List<TreeNode<OntologyNode>>>();
      
      // page elements are not
      Map<String, Set<TreeNode<OntologyNode>>> pageElementsByRecord = new HashMap<String, Set<TreeNode<OntologyNode>>>();

      TreeNode<OntologyNode> newNode = new TreeNode<OntologyNode>(nodeContents);
      String parentLabel = "unknown";
      if (nodeContents.get("label") != null)
        parentLabel = nodeContents.get("label").get(0);

      // a sub-category node that will hold tracks, if any
      TreeNode<OntologyNode> trackSubCategory = makeCategoryNode("Genome Browser Tracks", "Genome browser tracks",
								 new Integer(1), parentLabel + "-tracks", parentLabel);

      if (DEBUG) {
        if (nodeContents.get("EuPathDB alternative term") != null &&
            nodeContents.get("EuPathDB alternative term").get(0).equals("Gene models"))
          logger.info("------------------" + nodeContents.get("EuPathDB alternative term"));
      }

      boolean isTopLevel = false; // a hack to hide top level individuals
      for (TreeNode<OntologyNode> child : mappedChildren) {

        isTopLevel |= child.getContents().get("EuPathDB alternative term") != null &&
            child.getContents().get("EuPathDB alternative term").get(0).equals("Gene models");

        // a category - just add to parent
        if (child.getChildNodes().size() != 0) {
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
            if (nodeContents.get("EuPathDB alternative term") != null &&
                nodeContents.get("EuPathDB alternative term").get(0).equals("Gene models"))
              if (recordName != null)
                logger.info("*************************** record name: " + recordName);
          }

          // if a track, add into that sub category
          if (targetType.contains("track")) {
            trackSubCategory.addChildNode(child);
          } 

          // if a wdk entity, add into a sub category based on its record class name
          else if (scope.contains("menu") || scope.contains("webservice")) {
            if (!searchesByRecord.containsKey(recordName)) searchesByRecord.put(recordName, new ArrayList<TreeNode<OntologyNode>>());
            searchesByRecord.get(recordName).add(child);
          }
          else if (scope.contains("record")) {
            if (!pageElementsByRecord.containsKey(recordName)) pageElementsByRecord.put(recordName, new HashSet<TreeNode<OntologyNode>>());
            pageElementsByRecord.get(recordName).add(child);
          }
        }
      }

      // now add in our synthetic categories
      if (isTopLevel)
        return newNode; // don't bother if we are in the very top level

      if (trackSubCategory.getChildNodes().size() != 0)
        newNode.addChildNode(trackSubCategory);

      if (searchesByRecord.size() != 0) {
        TreeNode<OntologyNode> searchesSubCategory = makeCategoryNode("Searches", "Searches", new Integer(2), parentLabel+"-searches", parentLabel);
        newNode.addChildNode(searchesSubCategory);
	int order = 1;
        for (String recordName : new TreeSet<String>(searchesByRecord.keySet())) {
          for (TreeNode<OntologyNode> individual : searchesByRecord.get(recordName)) {
	    List<String> l = new ArrayList<String>();
	    l.add(new Integer(order++).toString());
	    individual.getContents().put("display order", l);
            searchesSubCategory.addChildNode(individual);
          }
        }
      }

      if (pageElementsByRecord.size() != 0) {
        TreeNode<OntologyNode> pageSubCategory = makeCategoryNode("Record Pages", "Record pages", new Integer(3), parentLabel+"-records", parentLabel);
        newNode.addChildNode(pageSubCategory);
        for (String recordName : new TreeSet<String>(pageElementsByRecord.keySet())) {
          TreeNode<OntologyNode> recordSubCategory = makeCategoryNode(recordName + " Page", recordName + " Page", new Integer(2), parentLabel+"-records-"+recordName, parentLabel);
          pageSubCategory.addChildNode(recordSubCategory);
          for (TreeNode<OntologyNode> individual : pageElementsByRecord.get(recordName)) {
            recordSubCategory.addChildNode(individual);
          }
        }
        
      }

      if (DEBUG) {
        if (nodeContents.get("EuPathDB alternative term") != null &&
            nodeContents.get("EuPathDB alternative term").get(0).equals("Gene models"))
          logger.info(newNode.toString());
      }
      return newNode;
    }
  }

   /**
   * If the input nodeContents contains a recordClassName, parse it to derive a display name for the record
   * class. Set that property in the node contents, and return it.
   * 
   * @param nodeContents
   * @return record class display name, or null if none
   */
  private String setNodeRecordClassDisplayName(OntologyNode nodeContents) {
    String n = null;
    if (nodeContents.containsKey("recordClassName")) {
      String rcn = nodeContents.get("recordClassName").get(0);
      Pattern pattern = Pattern.compile("(.*)RecordClasses");
      Matcher matcher = pattern.matcher(rcn);
      if (matcher.find())
        n = matcher.group(1);
      if (n == null) n= "Malformed record class name: " + rcn;
      if (n.equals("Transcript"))
        n = "Gene";
      if (n.equals("DynSpan"))
        n = "Genomic Segment";
      if (n.equals("Sequence"))
        n = "Genomic Sequence";
      ArrayList<String> names = new ArrayList<String>();
      names.add(n);
      nodeContents.put("recordClassDisplayName", names);
    }
    return n;
  }

  private TreeNode<OntologyNode> makeCategoryNode(String displayName, String description, int order,
						  String label, String ontologyParent) {
    OntologyNode nodeContents = new OntologyNode();
    TreeNode<OntologyNode> node = new TreeNode<OntologyNode>(nodeContents);

    ArrayList<String> labels = new ArrayList<String>();
    labels.add(label);
    nodeContents.put("label", labels);

    // a flag to tell client these are special to site map
    ArrayList<String> sms = new ArrayList<String>();
    sms.add("true");
    nodeContents.put("SiteMapSpecial", sms);

    // remember the real ontology term we are under
    ArrayList<String> aa = new ArrayList<String>();
    aa.add(ontologyParent.replaceAll(" ", "-").toLowerCase());
    nodeContents.put("ontologyParent", aa);

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

 }
