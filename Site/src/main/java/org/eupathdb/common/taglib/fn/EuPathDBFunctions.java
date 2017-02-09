package org.eupathdb.common.taglib.fn;

public class EuPathDBFunctions {

  public static String defaultBanner(String currentBanner, String project) {
    if (currentBanner != null && !currentBanner.isEmpty()) {
      return currentBanner;
    }
    switch(project) {
      case "EuPathDB":
        return "EuPathDB : The Eukaryotic Pathogen Genomics Resource";
      case "AmoebaDB":
        return "AmoebaDB : The Amoeba Genomics Resource";
      case "CryptoDB":
        return "CryptoDB : The Cryptosporidium Genomics Resource";
      case "FungiDB":
        return "FungiDB: The Fungal and Oomycete Genomics Resource";
      case "GiardiaDB":
        return "GiardiaDB : The Giardia Genomics Resource";
      case "HostDB":
        return "HostDB";
      case "MicrosporidiaDB":
        return "MicrosporidiaDB : The Microsporidia Genomics Resource";
      case "PiroplasmaDB":
        return "PiroplasmaDB : The Piroplasma Genomics Resource";
      case "PlasmoDB":
        return "PlasmoDB : The Plasmodium Genomics Resource";
      case "SchistoDB":
        return "SchistoDB : The Schistosoma Genomics Resource";
      case "ToxoDB":
        return "ToxoDB : The Toxoplasma Genomics Resource";
      case "TrichDB":
        return "TrichDB : The Trichomonas Genomics Resource";
      case "TriTrypDB":
        return "TriTrypDB : The Kinetoplastid Genomics Resource";
      case "MicrobiomeDB":
        return "MicrobiomeDB : The Microbiome Resource";
      default:
        return null;
    }
  }
}
