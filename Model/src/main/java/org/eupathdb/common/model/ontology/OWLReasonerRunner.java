package org.eupathdb.common.model.ontology;

import org.apache.log4j.Logger;

import com.clarkparsia.pellet.owlapiv3.*;
import uk.ac.manchester.cs.factplusplus.owlapiv3.*;
import org.semanticweb.HermiT.Reasoner.*;

import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.reasoner.InferenceType;
import org.semanticweb.owlapi.reasoner.Node;
import org.semanticweb.owlapi.reasoner.NodeSet;
import org.semanticweb.owlapi.reasoner.OWLReasoner;
import org.semanticweb.owlapi.reasoner.OWLReasonerFactory;
import org.semanticweb.owlapi.model.*;
import org.semanticweb.owlapi.util.InferredAxiomGenerator;
import org.semanticweb.owlapi.util.InferredOntologyGenerator;
import org.semanticweb.owlapi.util.InferredSubClassAxiomGenerator;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Adapted from Matthew Horridge and Chris Mungall's OWL reasoner examples by Jie Zheng
 * University of Pennsylvania
 * Date: Nov-8-2011
 *
 * See:
 * http://geneontology.svn.sourceforge.net/viewvc/geneontology/OWLTools/src/owltools/OWLReasonerRunner.java?revision=3454&content-type=text%2Fplain
 */
public class OWLReasonerRunner {

  private final static Logger LOG = Logger.getLogger(OWLReasonerRunner.class);

  public static void main(String[] args) {
    String reasonerName = null;
    // String ontStr = "C:/Documents and Settings/Jie/My
    // Documents/Manuscript/2011_ontoDog/ontoDog/FGEDview/obi.owl";
    String ontStr = "http://www.co-ode.org/ontologies/pizza/pizza.owl";
    // String inferOntStr = "http://www.co-ode.org/ontologies/pizza/pizza_inferred.owl";
    String mergeOntStr = "http://www.co-ode.org/ontologies/pizza/pizza_merge.owl";
    String outFilename = "C:/Documents and Settings/Jie/My Documents/pizza_withInferred2.owl";

    OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
    OWLOntology ont = OntologyManipulator.loadFromWeb(ontStr, manager);

    OWLReasoner reasoner = runReasoner(manager, ont, reasonerName);

    OWLOntology inferredOnt = getOntologyWithInferredSuperClasses(manager, ont, mergeOntStr, reasoner);
    // OWLOntology inferredOnt = getInferredSuperClasses (manager, ont, inferOntStr, reasoner);
    // getCleanedOntologyWithInferredSuperClasses (manager, ont, mergeOntStr, reasonerName);

    // Save the inferred ontology. (Replace the URI with one that is appropriate for your setup)
    OntologyManipulator.saveToFile(manager, inferredOnt, outFilename);
  }

  public static OWLOntology getInferredSuperClasses(OWLOntologyManager manager, OWLOntology ont,
      String inferOntStr, OWLReasoner reasoner) {
    OWLOntology infOnt = null;

    // create inferred ontology
    if (inferOntStr == null || inferOntStr.trim().length() == 0) {
      infOnt = OntologyManipulator.createAnonymous(manager);
    }
    else {
      infOnt = OntologyManipulator.create(manager, inferOntStr);
    }

    // To generate an inferred ontology we use implementations of inferred axiom generators
    // to generate the parts of the ontology we want (e.g. subclass axioms, equivalent classes
    // axioms, class assertion axiom etc. - see the org.semanticweb.owlapi.util package for more
    // implementations).
    // Set up our list of inferred axiom generators
    List<InferredAxiomGenerator<? extends OWLAxiom>> gens = new ArrayList<InferredAxiomGenerator<? extends OWLAxiom>>();
    gens.add(new InferredSubClassAxiomGenerator());
    // Now get the inferred ontology generator to generate some inferred axioms
    InferredOntologyGenerator iog = new InferredOntologyGenerator(reasoner, gens);

    // Put the inferred axioms into a fresh empty ontology - note that there
    iog.fillOntology(manager, infOnt);

    // remove asserted subclass axioms
    Set<OWLAxiom> axs = infOnt.getAxioms();
    for (OWLAxiom ax : axs) {
      if (ont.containsAxiom(ax, true)) {
        manager.applyChange(new RemoveAxiom(infOnt, ax));
      }
    }

    return infOnt;
  }

  public static OWLOntology getOntologyWithInferredSuperClasses(OWLOntologyManager manager, OWLOntology ont,
      String inferOntStr, OWLReasoner reasoner) {
    OWLOntology infOnt = getInferredSuperClasses(manager, ont, inferOntStr, reasoner);

    // add inferred subclass axioms in target ontology
    Set<OWLAxiom> axs = infOnt.getAxioms();
    for (OWLAxiom ax : axs) {
      if (!ont.containsAxiom(ax, true)) {
        manager.applyChange(new AddAxiom(ont, ax));
      }
    }

    // Set<OWLOntology> onts = new HashSet<OWLOntology>();
    // onts.add(ont);
    // infOnt = OntologyManipulator.createFromOWLontologies(manager, inferOntStr, onts);
    return ont;
  }

  public static OWLOntology getCleanedOntologyWithInferredSuperClasses(OWLOntologyManager manager,
      OWLOntology ont, String mergeOntStr, OWLReasoner reasoner) {
    OWLDataFactory df = manager.getOWLDataFactory();

    ArrayList<OWLAxiom> axioms = new ArrayList<OWLAxiom>();

    // get all supclasses axioms including indirect
    Set<String> supAxioms = new HashSet<String>();
    for (OWLClass cs : ont.getClassesInSignature()) {
      if (cs.toString().equals("Thing") || cs.toString().equals("Nothing"))
        continue;

      NodeSet<OWLClass> super_indir = reasoner.getSuperClasses(cs, false);
      for (Node<OWLClass> ns : super_indir) {
        for (OWLClass oc : ns) {
          supAxioms.add(oc.toString() + " " + cs.toString());
        }
      }
    }

    // find subclassAxioms that need to be removed
    for (OWLClass cs : ont.getClassesInSignature()) {
      if (cs.toString().equals("Thing") || cs.toString().equals("Nothing"))
        continue;
      // get all direct super classes, include inferred and asserted
      Set<OWLClass> inferSupCls = new HashSet<OWLClass>();
      NodeSet<OWLClass> super_dir = reasoner.getSuperClasses(cs, true);

      for (Node<OWLClass> ns : super_dir) {
        for (OWLClass oc : ns) {
          inferSupCls.add(oc);
        }
      }

      // get all asserted super classes, and remove them from the super classes
      Set<OWLClass> assertSupCls = new HashSet<OWLClass>();
      Set<OWLSubClassOfAxiom> subAxs = ont.getSubClassAxiomsForSubClass(cs);
      for (OWLSubClassOfAxiom sAx : subAxs) {
        OWLClassExpression ex = sAx.getSuperClass();
        if (ex.getClassExpressionType() == ClassExpressionType.OWL_CLASS) {
          OWLClass aSupCls = sAx.getSuperClass().asOWLClass();
          assertSupCls.add(aSupCls);
          if (inferSupCls.contains(aSupCls)) {
            inferSupCls.remove(aSupCls);
          }
        }
      }

      // If current class has inferred direct super class, check whether we need to remove its asserted super
      // class
      if (inferSupCls.size() > 0) {
        for (OWLClass aCls : assertSupCls) {
          for (OWLClass iCls : inferSupCls) {
            if (supAxioms.contains(aCls.toString() + " " + iCls.toString())) {
              OWLAxiom ax = df.getOWLSubClassOfAxiom(cs, aCls);
              if (!axioms.contains(ax)) {
                axioms.add(ax);
                //LOG.debug(" " + OBIentity.getLabel (cs, ont, df) + " subclass of " + OBIentity.getLabel(aCls, ont, df));
              }
            }
          }
        }
      }
    }

    OWLOntology mergeOnt = getOntologyWithInferredSuperClasses(manager, ont, mergeOntStr, reasoner);

    // remove some asserted axioms
    for (OWLAxiom ax : axioms) {
      manager.applyChange(new RemoveAxiom(mergeOnt, ax));
    }

    return mergeOnt;
  }

  public static OWLReasoner runReasoner(OWLOntologyManager manager, OWLOntology ont, String reasonerName) {
    showMemory();

    OWLReasoner reasoner = createReasoner(ont, reasonerName);

    if (reasoner.isConsistent()) {
      LOG.info("Ontology is consistent.");

      // run reasoner and give total running time in ms
      long initTime = System.nanoTime();
      reasoner.precomputeInferences(InferenceType.CLASS_HIERARCHY);
      long totalTime = System.nanoTime() - initTime;
      LOG.info("   Total reasoner time = " + (totalTime / 1000000d) + " ms");

      // find whether there are unsatisfied classes
      OWLDataFactory df = manager.getOWLDataFactory();

      // We can easily get a list of unsatisfiable classes. (A class is unsatisfiable if it
      // can't possibly have any instances). Note that the getunsatisfiableClasses method
      // is really just a convenience method for obtaining the classes that are equivalent
      // to owl:Nothing.
      Node<OWLClass> unsatisfiableClasses = reasoner.getUnsatisfiableClasses();
      if (unsatisfiableClasses.getSize() > 1) {
        LOG.warn(
            "There are " + unsatisfiableClasses.getSize() + " unsatisfiable classes in the ontology: ");
        for (OWLClass cls : unsatisfiableClasses) {
          if (!cls.toString().equals("owl:Nothing")) {
            LOG.warn("    unsatisfiable: " + OBOentity.getLabel(cls, ont, df));
          }
        }
      }
    }
    else {
      LOG.error("Ontology is not consistent, stop generating inferred hierarchy!");
      reasoner = null;
    }

    return reasoner;
  }

  private static OWLReasoner createReasoner(OWLOntology ont, String reasonerName) {
    OWLReasonerFactory reasonerFactory = null;
    if (reasonerName == null || reasonerName.equals("hermit"))
      reasonerFactory = new ReasonerFactory();
    else if (reasonerName.equals("pellet"))
      reasonerFactory = new PelletReasonerFactory();
    else if (reasonerName.equals("factpp")) {
      reasonerFactory = new FaCTPlusPlusReasonerFactory();
    }
    else
      LOG.error("no such reasoner: " + reasonerName);

    OWLReasoner reasoner = reasonerFactory.createReasoner(ont);
    return reasoner;
  }

  public static void showMemory() {
    System.gc();
    System.gc();
    System.gc();
    long tm = Runtime.getRuntime().totalMemory();
    long fm = Runtime.getRuntime().freeMemory();
    long mem = tm - fm;
    LOG.debug(
        "Memory total:" + tm + " free:" + fm + " diff:" + mem + " (bytes) diff:" + (mem / 1000000) + " (mb)");
  }
}
