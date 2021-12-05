package org.eupathdb.common.fix.organism;

import static java.util.Map.entry;

import java.util.List;
import java.util.Map;

import org.eupathdb.common.fix.organism.MigrateOrganisms.OrganismMigration;

public class Build55 implements OrganismMigration {

  @Override
  public List<String> getProjectIds() {
    return List.of("TriTrypDB","EuPathDB");
  }

  @Override
  public Map<String, String> getOrganismMapping() {
    return Map.ofEntries(
      entry("Leishmania sp. MAR LEM2494","Leishmania martiniquensis LEM2494"),
      entry("unclassified Leishmania",REMOVE_ENTRY)
    );
  }

}
