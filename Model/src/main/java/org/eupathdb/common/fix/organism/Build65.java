package org.eupathdb.common.fix.organism;

import static java.util.Map.entry;

import java.util.List;
import java.util.Map;

import org.eupathdb.common.fix.organism.MigrateOrganisms.OrganismMigration;

public class Build65 implements OrganismMigration {

  @Override
  public List<String> getProjectIds() {
    return List.of("PlasmoDB","VectorBase","EuPathDB");
  }

  @Override
  public Map<String, String> getOrganismMapping() {
    return Map.ofEntries(
      entry("Anopheles funestus idAnoFuneDA-416_04","Anopheles funestus AfunGA1"),
      entry("Anopheles aquasalis idAnoAquaMG-Q_19","Anopheles aquasalis AaquGF1"),
      entry("Anopheles coluzzii AcolN3 idAnoColuKW18-c001_1","Anopheles coluzzii AcolN3"),
      entry("Anopheles moucheti idAnoMoucSN_F20_07","Anopheles moucheti AmouCM1"),
      entry("Plasmodium ovale wallikeri strain PowCR01","Plasmodium ovale wallikeri PowCR01")
      //entry("unclassified Leishmania",REMOVE_ENTRY)
    );
  }

}
