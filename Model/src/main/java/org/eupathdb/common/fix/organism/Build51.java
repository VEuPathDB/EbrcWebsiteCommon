package org.eupathdb.common.fix.organism;

import static java.util.Map.entry;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.eupathdb.common.fix.organism.MigrateOrganisms.OrganismMigration;

public class Build51 implements OrganismMigration {

  private static final List<String> PROJECT_IDS = Arrays.asList(new String[] {
    "FungiDB"
  });

  private static final List<String> ORGANISM_PARAMS = Arrays.asList(new String[] {
    "specific_host",         // from popsetParams.xml
    "BlastDatabaseOrganism", // from sharedParams.xml
    "motif_organism",        // from similarityParams.xml

    // from organismParams.xml
    "reference_strains_only",
    "no_ref_organism",
    "organism",
    "organismwithPhenotype",
    "organismSinglePick",
    "organismSinglePickCnv",
    "organismSinglePick",
    "gff_organism",
    "gff_organism_name",
    "organism_with_epitopes",
    "localorganism",
    "text_search_organism",
    "org_with_nonnuclear_genes",
    "org_with_centromere_genes",
    "org_with_Hagai_pathways",
    "organismWithCellularLocImages",
    "organismWithEstsInChromosomes"
  });

  private static final Map<String,String> ORGANISM_MAPPING = Map.ofEntries(
    entry("Aspergillus kawachii IFO 4308", "Aspergillus luchuensis IFO 4308"),
    entry("Aspergillus kawachii", REMOVE_ENTRY),
    entry("Aspergillus zonatus CBS 506.65", "Penicilliopsis zonata CBS 506.65"),
    entry("Aspergillus zonatus", REMOVE_ENTRY),
    entry("Cryptococcus deuterogattii R265", "Cryptococcus gattii VGII R265"),
    entry("Cryptococcus deuterogattii", REMOVE_ENTRY),
    entry("Fusarium oxysporum f. sp. cubense tropical race 4 54006", "Fusarium odoratissimum NRRL 54006"),
    entry("Fusarium oxysporum f. sp. cubense race 4", "Fusarium odoratissimum strain race 4"),
    entry("Fusarium oxysporum FOSC 3-a", "Fusarium oxysporum NRRL 32931"),
    entry("Magnaporthe oryzae 70-15", "Pyricularia oryzae 70-15"),
    entry("Magnaporthe oryzae BR32", "Pyricularia oryzae BR32"),
    entry("Magnaporthe oryzae", REMOVE_ENTRY),
    entry("Magnaporthe", REMOVE_ENTRY),
    entry("Mucor circinelloides f. lusitanicus CBS 277.49","Mucor lusitanicus CBS 277.49"),
    entry("Mucor circinelloides f. circinelloides 1006PhL", "Mucor circinelloides 1006PhL"),
    entry("Pythium ultimum var. sporangiiferum BR650", "Globisporangium ultimum var. sporangiiferum BR650"),
    entry("Pythium ultimum DAOM BR144", "Globisporangium ultimum DAOM BR144"),
    entry("Pythium ultimum", REMOVE_ENTRY),
    entry("Pythium vexans DAOM BR484","Phytopythium vexans DAOM BR484"),
    entry("Pythium vexans", REMOVE_ENTRY),
    entry("Pythium irregulare DAOM BR486", "Globisporangium irregulare DAOM BR486"),
    entry("Pythium irregulare", REMOVE_ENTRY),
    entry("Pythium iwayamai DAOM BR242034", "Globisporangium iwayamae DAOM BR242034"),
    entry("Pythium iwayamai", REMOVE_ENTRY),
    entry("Saccharomyces cerevisiae S288c", "Saccharomyces cerevisiae S288C")
  );

  @Override
  public List<String> getProjectIds() {
    return PROJECT_IDS;
  }

  @Override
  public List<String> getOrganismParams() {
    return ORGANISM_PARAMS;
  }

  @Override
  public Map<String, String> getOrganismMapping() {
    return ORGANISM_MAPPING;
  }
}
