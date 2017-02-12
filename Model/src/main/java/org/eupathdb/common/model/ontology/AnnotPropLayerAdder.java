package org.eupathdb.common.model.ontology;

import java.util.ArrayList;

import org.semanticweb.owlapi.model.AddAxiom;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLAxiom;
import org.semanticweb.owlapi.model.OWLDataFactory;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyManager;

//import owl2.TextFileReader;

/** 
 * 	Generate annotation property layer
 *		need to provide annotation property URI/string, source ontology URI,list of signature terms file, and annotation layer URI   
 *
 *  @author Jie Zheng
 */

public class AnnotPropLayerAdder {
	public static OWLOntology add(OWLOntologyManager manager, OWLOntology ont, OWLOntology sourceOnt, String annotPropURI, String annotPropVal, String termFilename) {
	    // Create factory to obtain a reference to a class
        OWLDataFactory df = manager.getOWLDataFactory();

        // Create annotation property
	   	OWLAnnotationProperty annotProp = df.getOWLAnnotationProperty(IRI.create(annotPropURI));
        
		// get terms need to be tagged from input file
		TextFileReader x = new TextFileReader(termFilename);
		x.ReadInMatrix();
		x.findPositionFromMatrix();
		ArrayList<String[]> matrix = x.getFileMatrix();
		int uriPos = x.getUriPos();
		int labelPos = x.getLabelPos();
		int preferredLabelPos = x.getPreferredLabelPos();
		int tagPos = x.getTagPos();
		int size = matrix.size();

		// count # of terms in a specific view
		int count = 0;
		
		// read in file only in correct format and not empty
		if (size > 1 && tagPos >=0 && uriPos >= 0) {
			if (annotPropVal == null) {
				System.out.println("\nWarning! If the alternative label or label of the terms provided in the term file: " + termFilename + ", they will be used as the value of the give annotation property: " + annotPropURI +".");
			}
						 
    		for(int j = 1; j < size; j++)
    		{ 
     			String[] row = matrix.get(j);
    			String termURI = null;
    			boolean tagged = false;
    			String propVal = annotPropVal;

     			if (uriPos < row.length) 										termURI = row[uriPos];
     			if (tagPos < row.length && row[tagPos].equalsIgnoreCase("X")) 	tagged = true;
     			
     			if (termURI != null && tagged && (sourceOnt == null || sourceOnt.containsClassInSignature(IRI.create(termURI), true))) { 
     				if (propVal == null && preferredLabelPos < row.length)		propVal = row[preferredLabelPos];
    	     		if (propVal == null && labelPos < row.length)				propVal = row[labelPos];
      				
    				if (propVal != null) {
	     				// create annotation property, written in English (en)  
	    				OWLAnnotation annot = df.getOWLAnnotation(annotProp, df.getOWLLiteral(propVal, "en"));
	    				// Add specified signature to the term
	    				OWLAxiom ax = df.getOWLAnnotationAssertionAxiom(IRI.create(termURI), annot);
	    				// Add the axiom to the ontology
	    				manager.applyChange(new AddAxiom(ont, ax));
	    				count ++;		
    				} 
    				/*
    				else {
    					System.out.println("Annotation property " + annotPropURI + " axiom cannot be added to the term " + termURI + " since no available value.");
    				}*/
    			} 
     			/*
     			if (tagged && validation && !sourceOnt.containsClassInSignature(IRI.create(termURI))){
        			System.out.println(termURI + " " + row[labelPos] + " does not exist in the source ontology");
        		}*/
     		}
     	} else {
    		System.out.println ("no term in the source ontology is request to add specified annotation property");
    	}
		
		System.out.println("\nTotal " + count + " terms are in the view.");	    	
		
		return ont;
	}
}
