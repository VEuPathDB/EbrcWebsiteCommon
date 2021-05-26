package org.eupathdb.common.fix.organism;

import static java.util.Map.entry;

import java.util.List;
import java.util.Map;

import org.eupathdb.common.fix.organism.MigrateOrganisms.OrganismMigration;
import org.gusdb.fgputil.ListBuilder;

public class Build52 implements OrganismMigration {

  @Override
  public List<String> getProjectIds() {
    return ListBuilder.asList("FungiDB");
  }

  @Override
  public Map<String, String> getOrganismMapping() {
    return Map.ofEntries(
      entry("Candida auris", REMOVE_ENTRY),
      entry("Candida duobushaemulonis", REMOVE_ENTRY),
      entry("Candida glabrata", REMOVE_ENTRY),
      entry("Candida haemulonis", REMOVE_ENTRY),
      entry("Capnodiales", REMOVE_ENTRY),
      entry("Cryptococcus gattii", REMOVE_ENTRY),
      entry("Glomeromycota", REMOVE_ENTRY),
      entry("Oomycetes", REMOVE_ENTRY),
      entry("Zygomycetes", REMOVE_ENTRY)
    );
  }

}
