package org.eupathdb.common.fix.organism;

import static java.util.Map.entry;

import java.util.List;
import java.util.Map;

import org.eupathdb.common.fix.organism.MigrateOrganisms.OrganismMigration;

public class Build67 implements OrganismMigration {

  @Override
  public List<String> getProjectIds() {
    return List.of("VectorBase","EuPathDB");
  }

  @Override
  public Map<String, String> getOrganismMapping() {
    return Map.ofEntries(
      entry("Anopheles cruzii idAnoCruzAS_RS32_06","Anopheles cruzii AcruBR1")
      entry("Anopheles maculipalpis idAnoMacuDA-375_x","Anopheles maculipalpis AmacGA1")
      entry("Dermacentor andersoni qqDerAnde1","Dermacentor andersoni qqDerAnde1.2")
      //entry("unclassified Leishmania",REMOVE_ENTRY)
    );
  }

}
