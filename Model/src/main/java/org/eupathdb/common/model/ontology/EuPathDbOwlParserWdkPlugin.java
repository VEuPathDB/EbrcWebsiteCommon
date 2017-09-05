package org.eupathdb.common.model.ontology;

import static org.gusdb.wdk.model.AttributeMetaQueryHandler.getDynamicallyDefinedAttributes;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.Timer;
import org.gusdb.fgputil.functional.TreeNode;
import org.gusdb.fgputil.runtime.GusHome;
import org.gusdb.wdk.model.AttributeMetaQueryHandler;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.ontology.OntologyAttribute;
import org.gusdb.wdk.model.ontology.OntologyFactoryPlugin;
import org.gusdb.wdk.model.ontology.OntologyNode;
import org.gusdb.wdk.model.query.SqlQuery;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLDataFactory;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.reasoner.Node;
import org.semanticweb.owlapi.reasoner.OWLReasoner;

public class EuPathDbOwlParserWdkPlugin implements OntologyFactoryPlugin {

  private static Logger LOG = Logger.getLogger(EuPathDbOwlParserWdkPlugin.class);

  public static final String orderAnnotPropStr = "http://purl.obolibrary.org/obo/EUPATH_0000274"; // Display order annotation property IRI                                                                                        
  public static final String reasonerName = "hermit";
  public static final String owlFilePathParam = "owlFilePath";
  public static final String ATTRIBUTE_META_QUERY = "attributeMetaQuery";

  private TreeNode<OntologyNode> _tree = null;

  @Override
  public TreeNode<OntologyNode> getTree(Map<String, String> parameters, String ontologyName, WdkModel wdkModel)
      throws WdkModelException {

    if (_tree == null) {
      synchronized (this) {
        if (_tree == null) {
          _tree = makeTree(parameters);

          // Replaces attributeMetaQueries with attributes obtained by executing those queries.
          postProcessAttributeMetaQueries(_tree, wdkModel);
        }
      }
    }
    return _tree;
  }

  private synchronized TreeNode<OntologyNode> makeTree(Map<String, String> parameters) throws WdkModelException {
    String inputOwlFile = GusHome.getGusHome() + "/" + parameters.get(owlFilePathParam);

    // load OWL format ontology
    OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
    OWLOntology ont = OntologyManipulator.load(inputOwlFile, manager);
    OWLDataFactory df = manager.getOWLDataFactory();

    // reasoning the ontology
    OWLReasoner reasoner = OWLReasonerRunner.runReasoner(manager, ont, reasonerName);

    // get root node
    Node<OWLClass> topNode = reasoner.getTopClassNode();
    OWLClass owlClass = topNode.getEntities().iterator().next(); // get first one
    OntologyNode contents = convertToMap(ont, df, owlClass);
    // if (contents == null) throw new WdkModelException("For ontology '" + ontologyName + "' the root node has null contents");
    if (contents == null) contents = new OntologyNode();
    TreeNode<OntologyNode> tree = new TreeNode<OntologyNode>(contents);

    // build tree
    build(topNode, reasoner, ont, df, df.getOWLAnnotationProperty(IRI.create(orderAnnotPropStr)), tree);

    return tree;
  }


  private static void build(Node<OWLClass> parentClass, OWLReasoner reasoner, OWLOntology ont, OWLDataFactory df,
      OWLAnnotationProperty orderAnnotProp, TreeNode<OntologyNode> parentTree) throws WdkModelException {
    // We don't want to print out the bottom node (containing owl:Nothing
    // and unsatisfiable classes) because this would appear as a leaf node
    // everywhere
    if (parentClass.isBottomNode()) return;

    // get children of a parent node and sort children based on their display order
    List<TermNode> childList = new ArrayList<TermNode>();

    for (Node<OWLClass> child : reasoner.getSubClasses(parentClass.getRepresentativeElement(), true)) {

      if (child.getSize() > 1)
        throw new WdkModelException("Node has multiple entities"); // how can we tell user which node?
 
      for (OWLClass owlClass : child.getEntities()) {
        String orderAnnotPropVal = OBOentity.getStringAnnotProps(owlClass, ont, orderAnnotProp);
 
       // if (orderAnnotPropVal.length() == 0) throw new WdkModelException("No order annotation provided in node");  // how to show user which node?
        if (orderAnnotPropVal.length() == 0) orderAnnotPropVal = "0";
        childList.add(new TermNode(child, Integer.parseInt(orderAnnotPropVal)));
      }
    }

    Collections.sort(childList);
    
    for (TermNode childTermNode : childList) {
      OWLClass owlClass = childTermNode.getNode().getEntities().iterator().next();  // only get first
      OntologyNode content = convertToMap(ont, df, owlClass);
      if (content != null) {
        TreeNode<OntologyNode> childTree = new TreeNode<>(content);
        parentTree.addChildNode(childTree);
        build(childTermNode.getNode(), reasoner, ont, df, orderAnnotProp, childTree);
      }

    }
  }

  private static OntologyNode convertToMap(OWLOntology ont, OWLDataFactory df, OWLClass cls) {
    OntologyNode node = new OntologyNode();
    Set<OWLAnnotation> annotList = cls.getAnnotations(ont);

    if (annotList.size() == 0)  return null;

    for (OWLAnnotation currAnnot : annotList) {
      OWLAnnotationProperty annotProp = currAnnot.getProperty();
      String annotPropLabel = OBOentity.getLabel(annotProp, ont, df);
      if (node.containsKey(annotPropLabel)) continue;   // apparently the class can return redundant annotation properties, with identical values.
      ArrayList<String> annotValues = OBOentity.getStringArrayAnnotProps(cls, ont, annotProp);
      if (annotValues.size() > 0 ) node.put(annotPropLabel, annotValues);
    }

    return node;
  }

  /**
   * Weeds out attributeMetaQueries and replaces with the attributes identified by running each
   * attributeMetaQuery (attributeMetaQuery refers to a query for attributes that are loaded from
   * the database)
   * @param tree - the tree potentially containing attributeMetaQueries
   * @param wdkModel - the wdk model needed to find and run the attributeMetaQueries
   * @throws WdkModelException
   */
  protected void postProcessAttributeMetaQueries(TreeNode<OntologyNode> tree, WdkModel wdkModel) throws WdkModelException {
    int totalAttributeMetaQueryNodes = 0;
    int totalNodesRemoved = 0;
    int totalNodesAdded = 0;
    List<TreeNode<OntologyNode>> branches = tree.getNonLeafNodes();

    // Starting with the non-leaf nodes because we need to link the new nodes back to the parent.  So we need a
    // handle on the parent.
    for (TreeNode<OntologyNode> branch : branches) {
      List<TreeNode<OntologyNode>> childNodes = branch.getChildNodes();
      List<TreeNode<OntologyNode>> newChildNodes = new ArrayList<>();
      Iterator<TreeNode<OntologyNode>> childNodeIterator = childNodes.iterator();
      while (childNodeIterator.hasNext()) {
        TreeNode<OntologyNode> childNode = childNodeIterator.next();
 
        // The attribute meta query node, if present, will be a leaf node  
        if (childNode.isLeaf()) {
          OntologyNode ontologyNode = childNode.getContents();

          // The attribute meta query node's target type will identify it as such.
          if (ontologyNode.get("targetType") != null && ATTRIBUTE_META_QUERY.equalsIgnoreCase(ontologyNode.get("targetType").get(0))) {

            // The label will contain the query set and the query separated by a period.
            String[] queryInfo = ontologyNode.get("label").get(0).split("\\.");
            if(queryInfo.length != 2) {
              throw new WdkModelException("An attribute meta query label " + ontologyNode.get("label") + " must be in the form querySet.query");
            }

            totalAttributeMetaQueryNodes++;

            // Using the original attributeMetaQuery entry content for the new attributes.  Just a few modifications
            // needed (to label, name, and targetType).
            final OntologyNode templateContent = childNode.getContents();
            SqlQuery query;
            try {
              query = (SqlQuery) wdkModel.getQuerySet(queryInfo[0]).getQuery(queryInfo[1]);
            }
            catch (WdkModelException e) {
              // model does not contain this query; probably from another project and excluded, so skip
              continue;
            }
            Timer timer = new Timer();
            List<TreeNode<OntologyNode>> substituteLeaves = new ArrayList<>();
            int counter = 0;
            for (Map<String,Object> row : getDynamicallyDefinedAttributes(query.getFullName(), wdkModel)) {
              OntologyAttribute attr = new OntologyAttribute();
              AttributeMetaQueryHandler.populate(attr, row);
              OntologyNode newNode = (OntologyNode)templateContent.clone();
              newNode.put("name", new ArrayList<>(Arrays.asList(attr.getName())));
              newNode.put("targetType", new ArrayList<>(Arrays.asList("attribute")));
              String label = newNode.get("recordClassName").get(0) + "." + attr.getName();
              newNode.put("label", new ArrayList<>(Arrays.asList(label)));
              newNode.put("display order", new ArrayList<>(Arrays.asList(String.valueOf(counter++))));
              substituteLeaves.add(new TreeNode<OntologyNode>(newNode));
            }
            newChildNodes.addAll(substituteLeaves);
            LOG.debug("Took " + timer.getElapsedString() + " to resolve AttributeMetaQuery: " + query.getFullName());
            childNodeIterator.remove();
            ++totalNodesRemoved;
          } // childNode is attribute meta query type inside this block
        } // childNode is leaf inside this block 
      } // iterating over all child nodes of the branch
      if(newChildNodes.size() > 0) {
        branch = branch.addAllChildNodes(newChildNodes);
        LOG.debug("Branch " + branch.getContents().get("name"));
        totalNodesAdded += newChildNodes.size();
        LOG.debug("Total attribute nodes added " + newChildNodes.size());
        LOG.debug("Running total attribute meta query nodes removed " + totalNodesRemoved);
        LOG.debug("");
      }
    } // iterating over all branches of tree
    LOG.debug("Total attribute meta query nodes " + totalAttributeMetaQueryNodes);
    LOG.debug("Total nodes added overall " + totalNodesAdded);
    LOG.debug("Total nodes removed overall " + totalNodesRemoved);
  }

  @Override
  public void validateParameters(Map<String, String> parameters, String ontologyName)
      throws WdkModelException {

    String owlFileName =  GusHome.getGusHome() + "/" +
        parameters.get(owlFilePathParam);
    if (!(new File(owlFileName).exists()))
      throw new WdkModelException("For ontology '" + ontologyName + "', OWL file does not exist: " + owlFileName);
  }

  private static class TermNode implements Comparable<TermNode>{
    private Node<OWLClass> node;
    private Integer order;

    public TermNode (Node<OWLClass> node, Integer order) {
        this.node = node;
        this.order = order;
    }

    public Node<OWLClass> getNode () {
        return node;
    }

    public Integer getOrder() {
        return order;
    }

    @Override
    public int compareTo(TermNode term) {
        return getOrder().compareTo(term.getOrder());
    }
  }
}
