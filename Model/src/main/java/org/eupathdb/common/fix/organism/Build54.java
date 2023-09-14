package org.eupathdb.common.fix.organism;

import static java.util.Map.entry;

import java.util.List;
import java.util.Map;

import org.eupathdb.common.fix.organism.MigrateOrganisms.OrganismMigration;
import org.gusdb.fgputil.ListBuilder;

public class Build54 implements OrganismMigration {

  @Override
  public List<String> getProjectIds() {
    return List.of("VectorBase","EuPathDB");
  }

  @Override
  public Map<String, String> getOrganismMapping() {
    return Map.ofEntries(
      entry("Anopheles stephensi Indian 2020", "Anopheles stephensi UCISS2018")
    );
  }

}
