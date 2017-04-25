package org.eupathdb.common.model.ontology;

import java.util.ArrayList;

import org.kohsuke.args4j.CmdLineException;
import org.kohsuke.args4j.CmdLineParser;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.model.AddAxiom;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLAxiom;
import org.semanticweb.owlapi.model.OWLDataFactory;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyManager;

/**
 * 	Generate annotation property layer
 *		need to provide file directory, file name of list of signature terms in tab-delimitted format, annotation property URI string, and output file name and ontology IRI
 *
 *  @author Jie Zheng
 */

public class DisplayLabelAdder
{
	public static void main(String[] args) {
		DisplayLabelAdderOptions bean = new DisplayLabelAdderOptions();
	    CmdLineParser parser = new CmdLineParser(bean);

	    try {
	        parser.parseArgument(args);
	    } catch( CmdLineException e ) {
	        System.err.println(e.getMessage());
	        parser.printUsage(System.err);
	        System.exit(1);
	    }

		String path = bean.getPath();
		String inputFilename = path + bean.getInputFilename();
		String outputFilename = path + bean.getOutputFilename();
		String annotPropStr = bean.getAnnotPropStr();
		String ontoIRIstr = bean.getOntoIRIstr();

	   	createAnnotLayer (inputFilename, outputFilename, annotPropStr, ontoIRIstr);
	}

	public static void createAnnotLayer (String termFilename, String outFilename, String annotPropStr, String ontIRIstr) {
 		// Get hold of an ontology manager
        OWLOntologyManager manager = OWLManager.createOWLOntologyManager();

    	// create an OWL file
		OWLOntology annotOwl = OntologyManipulator.create(manager, ontIRIstr);

        // Create factory to obtain a reference to a class
        OWLDataFactory df = manager.getOWLDataFactory();

        //create the annotation properties
        OWLAnnotationProperty annotProp = df.getOWLAnnotationProperty(IRI.create(annotPropStr));

        //get terms need to be tagged from a tab delimited text file (term URI, values)
		TextFileReader x = new TextFileReader(termFilename);
		x.ReadInMatrix();
		ArrayList<String[]> matrix = x.getFileMatrix();
		int uriPos = 0;
		int displayLabelPos = 1;

    	for(int j = 1; j < matrix.size(); j++)
    	{
     		String[] row = matrix.get(j);
    		String termURI = row[uriPos];

    		if (row.length > displayLabelPos && row[displayLabelPos].length()>0) {
	     		// create annotation property, written in English (en)
	    		OWLAnnotation annot = df.getOWLAnnotation(annotProp, df.getOWLLiteral(row[displayLabelPos], "en"));
	    		// Add specified signature to the term
	    		OWLAxiom ax = df.getOWLAnnotationAssertionAxiom(IRI.create(termURI), annot);
	    		// Add the axiom to the ontology
	    		manager.applyChange(new AddAxiom(annotOwl, ax));
    		}
     	}

    	OntologyManipulator.saveToFile(manager, annotOwl, outFilename);
	}
}
