package org.eupathdb.common.fix;

import static java.util.Map.entry;

import java.util.List;
import java.util.Map;

import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowUpdaterPlugin;
import org.gusdb.wdk.model.fix.table.TableRowUpdater;
import org.gusdb.wdk.model.fix.table.steps.StepData;

public class MigrateTextSearchToSolrPlugin implements TableRowUpdaterPlugin<StepData> {

  private static class SolrSearch {

    private final String _name;
    private final Map<String,String> _fieldMap;

    public SolrSearch(String name, Map<String,String> fieldMap) {
      _name = name;
      _fieldMap = fieldMap;
    }

    public String getName() { return _name; }
    public Map<String,String> getFieldMap() { return _fieldMap; }

  }

  private static final Map<String, SolrSearch> QUESTION_CONVERSIONS = Map.ofEntries(
    entry("GeneQuestions.GenesByTextSearchPhenotype", new SolrSearch("GeneQuestions.GenesByPhenotypeText", Map.ofEntries(
      entry("Phenotype", ""),
      entry("Rodent Malaria Phenotype", "")
    ))),
    entry("GeneQuestions.GenesByTextSearch", new SolrSearch("GeneQuestions.GenesByText", Map.ofEntries(
      entry("Alias", ""),
      entry("Cellular localization", ""),
      entry("Community annotation", ""),
      entry("EC descriptions", ""),
      entry("Gene ID", ""),
      entry("Gene notes", ""),
      entry("Genes of previous release", ""),
      entry("Gene product", ""),
      entry("Gene name", ""),
      entry("GO terms and definitions", ""),
      entry("Metabolic pathway names and descriptions", ""),
      entry("Phenotype", ""),
      entry("Protein domain names and descriptions", ""),
      entry("PubMed", ""),
      entry("Rodent Malaria Phenotype", ""),
      entry("Similar proteins (BLAST hits v. NRDB/PDB)", ""),
      entry("User comments", "")
    ))),
    entry("PopsetQuestions.PopsetsByTextSearch", new SolrSearch("PopsetQuestions.PopsetsByText", Map.ofEntries(
      entry("Organism", ""),
      entry("Description", ""),
      entry("Strain", ""),
      entry("Host", ""),
      entry("Note", ""),
      entry("Isolation Source", ""),
      entry("Geographic Location", ""),
      entry("Reference", ""),
      entry("Overlapping gene (ID or product)", "")
    ))),
    entry("CompoundQuestions.CompoundsByTextSearch", new SolrSearch("CompoundQuestions.CompoundsByText", Map.ofEntries(
      entry("Compound Name", ""),
      entry("Synonyms", ""),
      entry("Metabolic Pathways", ""),
      entry("Reactions and Enzymes", ""),
      entry("Definition", ""),
      entry("Secondary Identifiers", ""),
      entry("IUPAC Names", ""),
      entry("Properties (InChI, InChIKey, IUPAC Name, SMILES, Molecular Weight)", "")
    )))
  );

  private static final String OLD_DATASET_QUESTION = "DatasetQuestions.DatasetsByTextSearch";
  private static final String NEW_DATASET_QUESTION = "DatasetQuestions.DatasetsByText";
  private static final String[] DATASET_FIELD_VALUES = new String[] {
      "name", "category", "usage", "caveat", "acknowledgement",
      "type", "subtype", "summary", "description", "contact", "institution", "pubmed_id", "citation"
  };

  private boolean _performUpdates = false;

  @Override
  public void configure(WdkModel wdkModel, List<String> additionalArgs) throws Exception {
    _performUpdates = !additionalArgs.isEmpty() && additionalArgs.get(0).equals("-write");
  }

  @Override
  public TableRowUpdater<StepData> getTableRowUpdater(WdkModel wdkModel) {
    return null;
    /*
    select distinct question_name
    from userlogins5.steps
    where question_name like '%Text%'
    and project_id != 'OrthoMCL';
    */
  }

  @Override
  public RowResult<StepData> processRecord(StepData nextRow) throws Exception {
    // TODO Auto-generated method stub
    return null;
  }

  @Override
  public void dumpStatistics() {
    // TODO Auto-generated method stub
    
  }

}
