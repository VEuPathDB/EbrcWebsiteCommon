package org.eupathdb.common.model.ontology;

import java.util.ArrayList;

import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLDataFactory;
import org.semanticweb.owlapi.model.OWLEntity;
import org.semanticweb.owlapi.model.OWLLiteral;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.vocab.OWLRDFVocabulary;

/**
 * 	Get annotation information of an OWLentity including label
 *
 *  @author Jie Zheng
 */
public class OBOentity {

	public static ArrayList<String> getStringArrayAnnotProps (OWLEntity cls, OWLDataFactory df, OWLOntology ont, OWLAnnotationProperty annotProp){
		ArrayList<String> propVals = new ArrayList<String>();

		for (OWLAnnotation annotation : cls.getAnnotations(ont, annotProp)) {
    		if (annotation.getValue() instanceof OWLLiteral) {
    			OWLLiteral val = (OWLLiteral) annotation.getValue();
    			String s = val.getLiteral();
    			if (s.length() > 0) {
    				propVals.add(s);
    				//System.out.println(s);
    			}
    		}
    	}

		return propVals;
	}

	public static String getStringAnnotProps (OWLEntity cls, OWLDataFactory df, OWLOntology ont, OWLAnnotationProperty annotProp){
		String propStr = "";

		for (OWLAnnotation annotation : cls.getAnnotations(ont, annotProp)) {
    		if (annotation.getValue() instanceof OWLLiteral) {
    			OWLLiteral val = (OWLLiteral) annotation.getValue();
    			String s = val.getLiteral();
    			if (s.length() > 0) {
    				if (propStr.length() > 0) {
    					propStr = propStr + ", " + s;
    				} else {
    					propStr = s;
    				}
    			}
    		}
    	}

		return propStr;
	}

	public static ArrayList<IRI> getIRIAnnotProps (OWLEntity cls, OWLDataFactory df, OWLOntology ont, OWLAnnotationProperty  annotProp){
		ArrayList<IRI> propVals = new ArrayList<IRI>();

		for (OWLAnnotation annotation : cls.getAnnotations(ont, annotProp)) {
    		if (annotation.getValue() instanceof IRI) {
    			IRI val = (IRI) annotation.getValue();
    			propVals.add(val);
    		}
    	}

		return propVals;
	}

	public static String getLabel (OWLEntity cls, OWLOntology ont, OWLDataFactory df) {
		String label = "";

		OWLAnnotationProperty ap = df.getOWLAnnotationProperty(OWLRDFVocabulary.RDFS_LABEL.getIRI());
		for (OWLAnnotation annotation : cls.getAnnotations(ont, ap)) {
			label = ((OWLLiteral) annotation.getValue()).getLiteral();
		}

		if (label.length()==0) {
			String IRIstr = cls.getIRI().toString();
			String[] parts = IRIstr.split("#");
			if (parts.length > 1) {
				label = parts[parts.length-1];
			}
		}

		return label;
	}

	public static boolean isObsolete (OWLEntity cls, OWLOntology ont, OWLDataFactory df) {
		boolean is_obsolete = false;
		OWLAnnotationProperty deprecateProp = df.getOWLAnnotationProperty(IRI.create(Config.Deprecated_AnnotPorp));

		for (OWLAnnotation annotation : cls.getAnnotations(ont, deprecateProp)) {
    		if (annotation.getValue() instanceof OWLLiteral) {
    			OWLLiteral ol = (OWLLiteral) annotation.getValue();
    			if (ol.isBoolean()) {
    				is_obsolete = ol.parseBoolean();
    			}
    		}
		}

		return is_obsolete;
	}

	public static OWLLiteral getLabelOWLLiteral (OWLEntity cls, OWLOntology ont, OWLDataFactory df) {
		OWLLiteral labelOWLLiteral = null;

		OWLAnnotationProperty ap = df.getOWLAnnotationProperty(OWLRDFVocabulary.RDFS_LABEL.getIRI());
		for (OWLAnnotation annotation : cls.getAnnotations(ont, ap)) {
    		if (annotation.getValue() instanceof OWLLiteral) {
    			labelOWLLiteral = (OWLLiteral) annotation.getValue();
    		}
		}
		return labelOWLLiteral;
	}
}
