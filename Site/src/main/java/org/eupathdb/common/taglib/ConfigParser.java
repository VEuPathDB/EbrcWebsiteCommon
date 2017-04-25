package org.eupathdb.common.taglib;

/**
Parse a specified java config file to a XML Document and export it to the JSP page scope.
Feb 6, 2008, carypen@uga.edu,mheiges@uga.edu
**/

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;

import javax.servlet.ServletContext;
import javax.servlet.jsp.JspContext;
import javax.servlet.jsp.JspException;
import javax.servlet.jsp.PageContext;
import javax.servlet.jsp.tagext.SimpleTagSupport;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class ConfigParser extends SimpleTagSupport {

    protected String var;
    protected String configfile;
    protected int varScope;
    
    public ConfigParser() {
        varScope = PageContext.PAGE_SCOPE;
    }
    
    public void setVar(String name) {
        var = name;
    }
    public void setConfigfile(String file) {
        configfile = file;
    }

    @Override
    public void doTag() throws JspException { 

        if (var == null || configfile == null) return;

        Document config = null;
        PageContext pageContext = (PageContext) getJspContext();
        ServletContext app = pageContext.getServletContext();

        InputStream is = app.getResourceAsStream(configfile);

        if (is == null) {
            if (! configfile.startsWith("/")) {
                throw new JspException(
                  "Failed parsing configfile " + configfile + "."
                  + " Path does not begin with '/'");
            }
            throw new JspException(
                "Failed parsing configfile '" + configfile + "'." +
                "\nCheck that the file exists and is readable: " +
                app.getRealPath(configfile) );
        }

        try {	
	    DocumentBuilder dB = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            config = dB.parse(is);
        } catch (IOException e) {
            throw new JspException(e);
        } catch (Exception e) {
            throw new JspException(e);
        }
	NodeList site_nodes = config.getElementsByTagName("project");
        export(site_nodes);
    } 

    public void export(NodeList nodeList){
	LinkedHashMap<String,String> map = new LinkedHashMap<String,String>(); 
	JspContext jspContext = getJspContext();
	String projectId,url;
	for(int i=0;i<nodeList.getLength();i++){
	    Node node = nodeList.item(i);
	    NamedNodeMap namedNodeMap = node.getAttributes();
	    projectId = namedNodeMap.getNamedItem("name").getNodeValue();
	    url = namedNodeMap.getNamedItem("site").getNodeValue();
			url = url + "services/WsfService";
	    map.put(projectId,url);
	}
	jspContext.setAttribute(var, map, varScope);
    }
}
