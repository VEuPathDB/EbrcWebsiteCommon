package org.eupathdb.common.model.ontology;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import org.apache.log4j.Logger;
import org.kohsuke.args4j.CmdLineException;
import org.kohsuke.args4j.CmdLineParser;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.model.AddAxiom;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLDataFactory;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.vocab.OWLRDFVocabulary;

/**
 * Read tab-delimited file and convert to ontology classes associated with some annotationProperties in OWL format
 *   1st Row is header and contains language setting information of annotations in the format '(language code)' e.g. en for English, es for Spanish
 *   2nd Row specifies the AnnotationProperty ID in the ontology
 *     For annotationProperty ID, it can be in two formats:
 *       - existing annotationProperty, provide its ID, such as EUPATH_0000274
 *       - new annotationProperty, using readable label, such as eupath.owl#targetType
 * By default, 1st col is term label, 2nd col is term parent IRI, and 4th col and following are annotations of the term
 *
 * We need to specify the starting ID need to assign to a new term, if the starting ID is -1, then the label
 * of the term will be used as the ID
 *
 * @author Jie Zheng
 */

public class OwlClassGenerator {

  private static final Logger LOG = Logger.getLogger(OwlClassGenerator.class);

  public static void main(String[] args) {
    try {
      new OwlClassGenerator().generateOwlFile(parseArgs(args));
    }
    catch (Exception e) {
      System.err.println(e.getMessage());
    }
  }

  public void generateOwlFile(OwlClassGeneratorOptions config) throws IOException {

    // load tab-delimited file
    List<String[]> matrix = loadIndividualsFile(config);

    // create an OWL file
    OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
    OWLOntology outOWL = OntologyManipulator.create(manager, config.getOntoIRIstr());

    // Create factory to obtain a reference to a class
    OWLDataFactory df = manager.getOWLDataFactory();

    // Find annotation language information based on the column header in the tab-delimited file (1st row)
    String[] languageCodes = loadLanguageCodes(matrix.get(0), config.getAnnotPos());

    // Create annotation properties based on the IDs provided in the tab-delimited file (2nd row)
    List<OWLAnnotationProperty> annotProps = loadAnnotationProps(matrix.get(1), config.getAnnotPos(), config.getIdBase(), df);

    // create classes
    createClasses(config, matrix, manager, outOWL, df, languageCodes, annotProps);

    // save file to disk
    OntologyManipulator.saveToFile(manager, outOWL, config.getOutputFilePath());
  }

  private static void createClasses(OwlClassGeneratorOptions config, List<String[]> matrix, OWLOntologyManager manager,
      OWLOntology outOWL, OWLDataFactory df, String[] languageCodes, List<OWLAnnotationProperty> annotProps) {
    Function<String,String> iriDecorator = str -> config.getOntoIRIstr() + "#" + str;
    int startId = config.getStartId();
    for (int i = 2; i < matrix.size(); i++) {
      String[] tokens = matrix.get(i);

      // generate class IRI
      String termIRIstr;
      if (startId == -1) {
        termIRIstr = iriDecorator.apply(cleanString(tokens[config.getLabelPos()]));
      }
      else {
        termIRIstr = config.getIdBase() + getOntologyTermID(config.getDomainName(), startId);
        startId++;
      }

      OWLClass cls = df.getOWLClass(IRI.create(termIRIstr));

      // add class parent
      OWLClass parent = getParentClass(tokens[config.getParentPos()], iriDecorator, df);
      manager.applyChange(new AddAxiom(outOWL, df.getOWLSubClassOfAxiom(cls, parent)));

      // add term label
      OWLAnnotationProperty labelProp = df.getOWLAnnotationProperty(OWLRDFVocabulary.RDFS_LABEL.getIRI());
      OWLAnnotation label = df.getOWLAnnotation(labelProp, df.getOWLLiteral(cleanString(tokens[config.getLabelPos()])));
      manager.applyChange(new AddAxiom(outOWL, df.getOWLAnnotationAssertionAxiom(cls.getIRI(), label)));

      // add other annotation properties
      for (int j = config.getAnnotPos(); j < tokens.length; j++) {
        String item = cleanString(tokens[j]);
        int jOffset = j - config.getAnnotPos();
        if (!item.isEmpty() && annotProps.size() > jOffset) {
          String lang = languageCodes[j];
          OWLAnnotationProperty property = annotProps.get(jOffset);
          OWLAnnotation annot = lang.isEmpty() ?
            df.getOWLAnnotation(property, df.getOWLLiteral(item)) :
            df.getOWLAnnotation(property, df.getOWLLiteral(item, lang));
          manager.applyChange(new AddAxiom(outOWL, df.getOWLAnnotationAssertionAxiom(cls.getIRI(), annot)));
        }
      }
    }
  }

  private static OWLClass getParentClass(String parentToken, Function<String,String> iriDecorator, OWLDataFactory df) {
    String parentStr = cleanString(parentToken);
    String iriStr = 
        parentStr.startsWith("http") ? parentStr :
        parentStr.length() > 0 ? iriDecorator.apply(parentStr) :
        "http://www.w3.org/2002/07/owl#Thing";
    return df.getOWLClass(IRI.create(iriStr));
  }

  private static List<OWLAnnotationProperty> loadAnnotationProps(String[] items, int annotPos, String idBase, OWLDataFactory df) {
    List<OWLAnnotationProperty> annotProps = new ArrayList<>();
    for (int k = annotPos; k < items.length; k++) {
      String item = cleanString(items[k]);
      if (item.length() > 0) {
        OWLAnnotationProperty annotProp = df.getOWLAnnotationProperty(IRI.create(idBase + item));
        annotProps.add(annotProp);
      }
    }
    return annotProps;
  }

  private static String[] loadLanguageCodes(String[] tokens, int annotPos) {
    String[] languageCodes = new String[tokens.length];
    for (int k = annotPos; k < tokens.length; k++) {
      int start = tokens[k].indexOf("(");
      int end = tokens[k].indexOf(")");
      if (start >= 0 && end >= 0) {
        languageCodes[k] = tokens[k].substring(start + 1, end);
      }
      else {
        languageCodes[k] = "";
      }
    }
    return languageCodes;
  }

  private static List<String[]> loadIndividualsFile(OwlClassGeneratorOptions config) throws IOException {
    try (BufferedReader br = new BufferedReader(new FileReader(config.getInputFilePath()))) {
      List<String[]> matrix = new ArrayList<>();
      String line = null;
      int lineNum = 0;
      while ((line = br.readLine()) != null) {
        lineNum++;
        if (!(line.trim().startsWith("##") || line.trim().length() == 0)) {
          String[] items = line.split("\t");
          matrix.add(items);
          if (items.length > matrix.get(0).length) {
            throw new IOException("Generation of the OWL file, " + config.getOutputFilename() + "has stopped.  Line " +
                lineNum + " in input tab-delimited file " + config.getInputFilename() + " has " + items.length +
                " columns but " + matrix.get(0).length + " are expected.");
          }
        }
      }
      LOG.info("Successfully read text file: " + config.getInputFilename());
      return matrix;
    }
  }

  private static OwlClassGeneratorOptions parseArgs(String[] args) {
    OwlClassGeneratorOptions config = new OwlClassGeneratorOptions();
    CmdLineParser parser = new CmdLineParser(config);
    try {
      parser.parseArgument(args);
      return config;
    }
    catch (CmdLineException e) {
      parser.printUsage(System.err);
      System.exit(1);
      return null;
    }
  }

  private static String getOntologyTermID(String domainName, int startID) {
    String s = "0000000" + startID;
    String id = domainName.toUpperCase() + "_" + s.substring(s.length() - 7);
    return id;
  }

  private static String cleanString(String s) {
    return s.trim().replaceAll("^\"|\"$", "");
  }
}
