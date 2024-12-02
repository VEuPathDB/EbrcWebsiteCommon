package org.eupathdb.common.fix.organism;

import static java.util.Map.entry;

import java.util.List;
import java.util.Map;

import org.eupathdb.common.fix.organism.MigrateOrganisms.OrganismMigration;

public class Build66 implements OrganismMigration {

  @Override
  public List<String> getProjectIds() {
    return List.of("VectorBase","EuPathDB");
  }

  @Override
  public Map<String, String> getOrganismMapping() {
    return Map.ofEntries(
      entry("Anopheles darlingi idAnoDarlMG-H_01","Anopheles darlingi AdarGF1")
      //entry("unclassified Leishmania",REMOVE_ENTRY)
    );
  }

}
