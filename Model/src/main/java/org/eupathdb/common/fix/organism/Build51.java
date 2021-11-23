package org.eupathdb.common.fix.organism;

import static java.util.Map.entry;

import java.util.List;
import java.util.Map;

import org.eupathdb.common.fix.organism.MigrateOrganisms.OrganismMigration;
import org.gusdb.fgputil.ListBuilder;

public class Build51 implements OrganismMigration {

  @Override
  public List<String> getProjectIds() {
    return ListBuilder.asList("FungiDB");
  }

  @Override
  public Map<String, String> getOrganismMapping() {
    return Map.ofEntries(
      entry("Anopheles gambiae str. PEST", "Anopheles gambiae PEST"),
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
  }
}
