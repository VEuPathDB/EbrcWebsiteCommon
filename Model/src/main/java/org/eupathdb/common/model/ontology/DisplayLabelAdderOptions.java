package org.eupathdb.common.model.ontology;

import org.kohsuke.args4j.Option;

/**
 *  Process arguments passed from command line for DisplayLabelAdder.java
 *
 *  @author Jie Zheng
 */
public class DisplayLabelAdderOptions {
    @Option(name="-path", usage ="the directory contains input file and also for saved output file", required = false)
    private String path = "C:/Users/jiezheng/Documents/EuPathDB/ontology/";

    @Option(name="-inputFilename", usage="Display label tab delimited file, used as input. The file contains at least two cloumns, first column is Ontology term IRI, second column is the display name of the ontology term", required = false)
    private String inputFilename = "displayLabels.txt";

    @Option(name="-outputFilename", usage="The filename of output OWL file", required = false)
    private String outputFilename = "displayLabels.owl";

    @Option(name="-annotPropStr", usage="IRI of annotationProperter for display name", required = false)
    private String annotPropStr = "http://purl.obolibrary.org/obo/eupath.owl#displayName";

    @Option(name="-ontoIRIstr", usage="IRI of ontology contains term display labels in OWL format", required = false)
    private String ontoIRIstr = "http://purl.obolibrary.org/obo/eupath/displayLabels.owl";

    public String getPath () {
    	return this.path;
    }

    public String getInputFilename () {
    	return this.inputFilename;
    }

    public String getOutputFilename () {
    	return this.outputFilename;
    }

    public String getAnnotPropStr () {
    	return this.annotPropStr;
    }

    public String getOntoIRIstr () {
    	return this.ontoIRIstr;
    }
}