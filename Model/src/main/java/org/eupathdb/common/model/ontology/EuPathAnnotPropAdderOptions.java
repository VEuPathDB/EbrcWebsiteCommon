package org.eupathdb.common.model.ontology;

import org.kohsuke.args4j.Option;

/**
 *  Process arguments passed from command line for DisplayLabelAdder.java
 *
 *  @author Jie Zheng
 */
public class EuPathAnnotPropAdderOptions {
    @Option(name="-path", usage ="the directory contains input file and also used for saved output file", required = false)
    private String path = "C:/Users/jiezheng/Documents/EuPathDB/test files/";

    @Option(name="-inputFilename", usage="input tab-delimited file that will be used to convert to OWL format file", required = false)
    private String inputFilename = "category_extraAnnotProps.txt";

    @Option(name="-termIRIPos", usage="number of column in the tab delimited file that contains ontology term IRIs ", required = false)
    private String termIRIPos = "2";

    @Option(name="-annotPos", usage="number of column and following colums in the tab delimited file that contain annotation of terms", required = false)
    private String annotPos = "3";

    @Option(name="-idBase", usage="Ontology term URI base", required = false)
    private String idBase = "http://purl.obolibrary.org/obo/";

    @Option(name="-ontoIRIstr", usage="IRI of ontology converted from the tab-delimited file", required = false)
    private String ontoIRIstr = "http://purl.obolibrary.org/obo/eupath/annotation.owl";

    @Option(name="-outputFilename", usage="The filename of output OWL file", required = false)
    private String outputFilename = "annotation.owl";

    public String getPath () {
    	return this.path;
    }

    public String getInputFilename () {
    	return this.inputFilename;
    }

    public int getTermIRIPos () {
    	int pos = Integer.parseInt(this.termIRIPos) -1;
    	return pos;
    }

    public int getAnnotPos () {
    	int pos = Integer.parseInt(this.annotPos) -1;
    	return pos;
    }

    public String getOutputFilename () {
    	return this.outputFilename;
    }

    public String getIdBase () {
    	return this.idBase;
    }

    public String getOntoIRIstr () {
    	return this.ontoIRIstr;
    }
}
