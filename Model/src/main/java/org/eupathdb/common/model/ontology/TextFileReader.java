package org.eupathdb.common.model.ontology;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.StringTokenizer;

/** 
 * 	Read text file in a specific format, might not work properly 
 *
 *  @author Jie Zheng
 */
public class TextFileReader {
	private String fileName;
	private ArrayList <String> storeValues;
	private ArrayList <String[]> matrix;
	
	private static final String SOURCE_IRI = "Source Class IRI";
	private static final String SOURCE_LABEL = "Source Class Label";
	private static final String TAG = "Community View Tag";
	private static final String PREFERRED_LABEL = "Community Preferred Label";
	private int uriPos = -1;
	private int labelPos = -1;
	private int preferredLabelPos = -1;
	private int tagPos = -1;

	public TextFileReader(String FileName)
	{
		this.fileName=FileName;
	}
	
	public void ReadInLines()
	{
		BufferedReader br = null;
		storeValues = new ArrayList<String>();
		
		try {
			br = new BufferedReader( new FileReader(fileName));
			String line = null;
 
			while( (line = br.readLine()) != null)
			{
				// System.out.println(line);
				storeValues.add(line);		
			}
			System.out.println("Successfully read text file: " + fileName);
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
	}

	public void ReadInMatrix()
	{
		BufferedReader br = null;
		this.matrix = new ArrayList<String[]> ();
		
		try {
			//storeValues.clear();//just in case this is the second call of the ReadFile Method./
			br = new BufferedReader( new FileReader(fileName));
			String line = null;
 
			while( (line = br.readLine()) != null)
			{
				String[] items = line.split("\t");  
				// System.out.println(line);
				matrix.add(items);	
			}
			System.out.println("Successfully read text file: " + fileName);
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
	}	
	
	public void findPositionFromLine () {
		String header = this.storeValues.get(0);
		StringTokenizer st = new StringTokenizer(header, "\t");
		
		int pos = 0;		
		while(st.hasMoreTokens())
		{	
			String cName = st.nextToken();
			
			if (cName.equalsIgnoreCase(SOURCE_IRI)) 			uriPos = pos;
			else if (cName.equalsIgnoreCase(SOURCE_LABEL)) 		labelPos = pos;
			else if (cName.equalsIgnoreCase(TAG)) 				tagPos = pos;
			else if (cName.equalsIgnoreCase(PREFERRED_LABEL)) 	preferredLabelPos = pos;		
		
			pos ++;
		}
	}
	
	public void findPositionFromMatrix () {
		String[] header = this.matrix.get(0);
				
		for (int i = 0; i < header.length; i ++)
		{	
			String cName = header[i];
			
			if (cName.equalsIgnoreCase(SOURCE_IRI)) 			uriPos = i;
			else if (cName.equalsIgnoreCase(SOURCE_LABEL)) 		labelPos = i;
			else if (cName.equalsIgnoreCase(TAG)) 				tagPos = i;
			else if (cName.equalsIgnoreCase(PREFERRED_LABEL)) 	preferredLabelPos = i;
		}
	}
	
	//mutators and accesors 
	public void setFileName(String newFileName)
	{
		this.fileName=newFileName;
	}
	
	public String getFileName()
	{
		return fileName;
	}
	
	public ArrayList<String> getFileLines()
	{
		return this.storeValues;
	}
	
	public ArrayList<String[]> getFileMatrix()
	{
		return this.matrix;
	}
	
	public int getUriPos ()
	{
		return uriPos;
	}
	
	public int getLabelPos ()
	{
		return labelPos;
	}
	
	public int getPreferredLabelPos ()
	{
		return preferredLabelPos;
	}
	
	public int getTagPos () {
		return tagPos;
	}
	
	public void displayArrayList()
	{
		for(int x=0;x<this.storeValues.size();x++)
		{
			System.out.println(storeValues.get(x));
		}
	}	

	/*
	public static void main(String[] args) {
		String fileName="C:/Documents and Settings/Jie/My Documents/Manuscript/2011_ontoDog/ontoDog/OBI_FGED.txt";
		TextFileReader x=new TextFileReader(fileName);
		//x.ReadInLines();
		//x.findPositionFromLine();
		// x.displayArrayList();
		x.ReadInMatrix();
		x.findPositionFromMatrix();
		
		System.out.println("URI pos " + x.getUriPos());
		System.out.println("Label pos " + x.getLabelPos());
		System.out.println("tag pos " + x.getTagPos());
		System.out.println("preferrred label pos " + x.getPreferredLabelPos());
		
		ArrayList <String[]> matrix = x.getFileMatrix();

		for (int i = 0; i < matrix.size(); i++) {
			String[] row = matrix.get(i);
			if (row.length > x.getUriPos())
				System.out.println("URI pos " + row[x.getUriPos()]);
			if (row.length > x.getLabelPos())
				System.out.println("Label pos " + row[x.getLabelPos()]);
			if (row.length > x.getTagPos())
				System.out.println("tag pos " + row[x.getTagPos()]);
			if (row.length > x.getPreferredLabelPos())
				System.out.println("preferrred label pos " + row[x.getPreferredLabelPos()]);			
		}
	}
	*/
}
