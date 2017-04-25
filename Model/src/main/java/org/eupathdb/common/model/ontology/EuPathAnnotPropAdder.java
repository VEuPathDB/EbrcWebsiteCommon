package org.eupathdb.common.model.ontology;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;

import org.kohsuke.args4j.CmdLineException;
import org.kohsuke.args4j.CmdLineParser;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.model.AddAxiom;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLAxiom;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLDataFactory;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyManager;

/**
 * 	Add one or more annotation properties to existing ontology terms
 *
 * 	Read tab-delimited file and convert to annotations of ontology terms in OWL format
 *  	1st Row is header and contain language setting information of annotations in the format '(language code0', language code is like, en for English, es for Spanish
 *  	2nd Row specifies the AnnotationProperty ID in the ontology
 *  		For annotationProperty ID, it can be in two formats:
 *  		- existing annotationProperty, provide its ID, such as EUPATH_0000274
 *  		- new annotationProperty, using readable label, such as eupath.owl#targetType
 *  	By default, 1st Col is term label, 2nd Col is term IRI, 3rd and following column(s) are annotations of the term
 *
 *  @author Jie Zheng
 */

public class EuPathAnnotPropAdder
{
	public static void main(String[] args) {
		EuPathAnnotPropAdderOptions bean = new EuPathAnnotPropAdderOptions();
	    CmdLineParser parser = new CmdLineParser(bean);

	    try {
	        parser.parseArgument(args);
	    } catch( CmdLineException e ) {
	        System.err.println(e.getMessage());
	        parser.printUsage(System.err);
	        System.exit(1);
	    }

		String path = bean.getPath();
		String inputFilename = bean.getInputFilename();
		String outputFilename = bean.getOutputFilename();
		String ontoIRIstr = bean.getOntoIRIstr();
		String idBase = bean.getIdBase();
		int termIRIPos = bean.getTermIRIPos();
		int annotPos = bean.getAnnotPos();

		// load tab-delimited file
		BufferedReader br = null;
		ArrayList <String[]> matrix = new ArrayList <String[]> ();

		try {
			br = new BufferedReader(new FileReader(path + inputFilename));
			String line = null;
			int lineNum = 0;
			while( (line = br.readLine()) != null)
			{	
			        lineNum ++;
				if (!(line.trim().startsWith("##") || line.trim().length()==0)) {
					String[] items = line.split("\t");
					matrix.add(items);
					if (items.length > matrix.get(0).length) {
						System.out.println("Generation of the OWl file, " + outputFilename + ", stop because input tab-delimited file line " + lineNum + " has extra columns");
						System.out.println("\t" + inputFilename + " Line " + lineNum + " has " + items.length + " columns and required columns number is " + matrix.get(0).length);
						System.exit(0);
					} 
				}
			}
			System.out.println("Successfully read text file: " + inputFilename);
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			try {
				if ( br != null ) br.close();
			}
			catch (IOException ex) {
				ex.printStackTrace();
			}
		}

    	// create an OWL file
        OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
		OWLOntology outOWL = OntologyManipulator.create(manager, ontoIRIstr);

        // Create factory to obtain a reference to a class
        OWLDataFactory df = manager.getOWLDataFactory();

        // Find annotation language information based on the column header in the tab-delimited file (1st row)
        String[] items = matrix.get(0);
		String[] languageCodes = new String[items.length];

        for (int k = annotPos; k< items.length; k++) {
			int start = items[k].indexOf("(");
			int end = items[k].indexOf(")");
			if (start >= 0 && end > start) {
				languageCodes[k] = items[k].substring(start+1, end).trim();
			} else {
				languageCodes[k] = "";
			}
		}
        
        // Create annotation properties based on the IDs provided in the tab-delimited file on the 2nd row
        ArrayList<OWLAnnotationProperty> annotProps = new ArrayList<OWLAnnotationProperty>();
        items = matrix.get(1);
        for (int k = annotPos; k< items.length; k++) {
        	String item = cleanString(items[k]);
        	if (item.length() > 0) {
        		OWLAnnotationProperty annotProp = df.getOWLAnnotationProperty(IRI.create(idBase + item));
        		annotProps.add(annotProp);
        	}
        }

        // add annotation to existing classes
	   	for (int i = 2; i < matrix.size(); i++) {
	   		items = matrix.get(i);

	   		OWLClass cls = df.getOWLClass(IRI.create(items[termIRIPos].trim()));

	        // add annotation properties
	        for (int j = annotPos; j < items.length; j ++) {
	        	String item = cleanString(items[j]);
	        	if (item.length()>0 && annotProps.size() > j-annotPos) {
	        		OWLAnnotation annot = null;
    	        	String lang = languageCodes[j];

    	        	if (lang.length() == 0) {
    	        		annot = df.getOWLAnnotation(annotProps.get(j-annotPos), df.getOWLLiteral(item));
    	        	} else {
    	        		annot = df.getOWLAnnotation(annotProps.get(j-annotPos), df.getOWLLiteral(item, lang));
    	        	}

    	        	OWLAxiom axiom = df.getOWLAnnotationAssertionAxiom(cls.getIRI(), annot);
	        		manager.applyChange(new AddAxiom(outOWL, axiom));
	        	}
	        }
	   	}

	   	OntologyManipulator.saveToFile(manager, outOWL, path + outputFilename);
	}
	
	public static String cleanString (String s) {
		s = s.trim().replaceAll("^\"|\"$", "");	

		return s;
	}
}
