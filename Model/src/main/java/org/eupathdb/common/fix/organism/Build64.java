package org.eupathdb.common.fix.organism;

import static java.util.Map.entry;

import java.util.List;
import java.util.Map;

import org.eupathdb.common.fix.organism.MigrateOrganisms.OrganismMigration;

public class Build55 implements OrganismMigration {

  @Override
  public List<String> getProjectIds() {
    return List.of("FungiDB","EuPathDB");
  }

  @Override
  public Map<String, String> getOrganismMapping() {
    return Map.ofEntries(
      entry("Candida glabrata CBS 138","Nakaseomyces glabratus CBS 138"),
      entry("Candida glabrata CBS138 2020","Nakaseomyces glabratus CBS138 2020"),
      entry("Candida glabrata DSY562","Nakaseomyces glabratus DSY562"),
      entry("Candida glabrata BG2","Nakaseomyces glabratus BG2"),
      //entry("unclassified Leishmania",REMOVE_ENTRY)
    );
  }

}
