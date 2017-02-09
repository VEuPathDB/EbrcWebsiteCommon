package org.eupathdb.common.jsp;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.FormatUtil;
import org.gusdb.fgputil.FormatUtil.Style;

/**
 * Utility program to analyze the use of tag libraries in .tag and .jsp files.
 * The main() program can be used to analyze a single file, or to recursively
 * search for .tag and .jsp files from a directory.  It will tell where taglibs
 * are declared but not used, and also give counts of the most popular used
 * taglibs, and those that are declared but not used.
 * 
 * @author ryan
 */
public class TagLibStatistics {

  private static final Logger LOG = Logger.getLogger(TagLibStatistics.class);

  public static class ExtraDeclarationResult {
    private Path _path;
    private String _prefix;
    public ExtraDeclarationResult(Path path, String prefix) {
      _path = path; _prefix = prefix;
    }
    public Path getPath() { return _path; }
    public String getPrefix() { return _prefix; }
  }

  public static class DeclarationStats {
    private Map<String, Integer> _usedMap = new HashMap<>();
    private Map<String, Integer> _unusedMap = new HashMap<>();
    private List<ExtraDeclarationResult> _extraDeclarations = new ArrayList<>();
    public Map<String, Integer> getUsedMap() { return _usedMap; }
    public Map<String, Integer> getUnusedMap() { return _unusedMap; }
    public List<ExtraDeclarationResult> getExtraDeclarations() { return _extraDeclarations; }
    public void addUsedPrefixes(List<String> usedPrefixes) {
      incrementCounts(_usedMap, usedPrefixes);
    }
    public void addUnusedPrefixes(Path file, Set<String> unusedPrefixes) {
      incrementCounts(_unusedMap, unusedPrefixes);
      for (String taglibPrefix : unusedPrefixes) {
        _extraDeclarations.add(new ExtraDeclarationResult(file, taglibPrefix));
      }
    }
    private void incrementCounts(Map<String, Integer> countsMap, Collection<String> prefixes) {
      for (String prefix : prefixes) {
        Integer oldCount = countsMap.get(prefix);
        countsMap.put(prefix, (oldCount == null ? 1 : oldCount + 1));
      }
    }
  }

  public static void main(String[] args) {
    try {
      Config config = parseArgs(args);
      TagLibStatistics statGen = new TagLibStatistics();
      DeclarationStats stats = new DeclarationStats();
      switch (config.getRunType()) {
        case FILE: statGen.findExtraDeclarations(config.getPath(), stats); break;
        case DIRECTORY: statGen.recursivelyFindExtraDeclarations(config.getPath(), stats); break;
      }
      for (ExtraDeclarationResult result : stats.getExtraDeclarations()) {
        System.out.println(result.getPath() + " declares " + result.getPrefix() + " but does not use it.");
      }
      System.out.println();
      System.out.println("Counts of used library declarations:" + FormatUtil.NL +
          FormatUtil.prettyPrint(sort(stats.getUsedMap(), Direction.DESC), Style.MULTI_LINE));
      System.out.println("Counts of unused library declarations:" + FormatUtil.NL +
          FormatUtil.prettyPrint(sort(stats.getUnusedMap(), Direction.DESC), Style.MULTI_LINE));
    }
    catch (IOException e) {
      throw new RuntimeException("Error occurred during processing.", e);
    }
  }

  private static enum Direction { ASC, DESC }

  private static Map<String, Integer> sort(Map<String, Integer> countsMap, final Direction direction) {
    List<Entry<String, Integer>> entries = new ArrayList<>(countsMap.entrySet());
    Collections.sort(entries, new Comparator<Entry<String, Integer>>() {
      @Override public int compare(Entry<String, Integer> o1, Entry<String, Integer> o2) {
        return (direction.equals(Direction.ASC) ? 1 : -1) * (o1.getValue() - o2.getValue());
      }
    });
    Map<String, Integer> sortedMap = new LinkedHashMap<>();
    for (Entry<String, Integer> entry : entries) {
      sortedMap.put(entry.getKey(), entry.getValue());
    }
    return sortedMap;
  }

  public void recursivelyFindExtraDeclarations(Path directory, final DeclarationStats stats) throws IOException {
    LOG.debug("Will recursively find unneeded taglib declarations in JSP files starting at: " + directory);
    Files.walkFileTree(directory, new SimpleFileVisitor<Path>() {
      @Override
      public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
        if (dir.getFileName().toString().equals(".svn")) return FileVisitResult.SKIP_SUBTREE;
        //LOG.info("Examining directory: " + dir);
        return FileVisitResult.CONTINUE;
      }
      @Override
      public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
        // check only .jsp and .tag files
        if (file.getFileName().toString().endsWith(".jsp") || file.getFileName().toString().endsWith(".tag")) {
          LOG.debug("Examining file: " + file);
          findExtraDeclarations(file, stats);
        }
        return FileVisitResult.CONTINUE;
      }
    });
  }

  public void findExtraDeclarations(Path file, DeclarationStats stats) throws IOException {

    // first pass, find all taglib declarations
    Set<String> taglibPrefixes = getDeclaredTaglibs(file);
    LOG.debug("Checked " + file + ".  Found " + taglibPrefixes.size() + " declared taglibs" +
        (taglibPrefixes.isEmpty() ? "." : ": " + FormatUtil.arrayToString(taglibPrefixes.toArray())));
    if (taglibPrefixes.isEmpty()) return;

    // second pass, find instances of taglib prefixes and note when there aren't any
    List<String> usedPrefixes = new ArrayList<>();
    try (FileReader fr = new FileReader(file.toFile());
         BufferedReader br = new BufferedReader(fr)) {
      while (br.ready()) {
        String line = br.readLine();
        List<String> prefixesToRemove = new ArrayList<>();
        for (String prefix : taglibPrefixes) {
          if (line.contains(prefix + ":")) {
            // found instance of taglib use; mark to remove
            LOG.debug("Found instance of " + prefix + " in line: " + line);
            prefixesToRemove.add(prefix);
          }
        }
        usedPrefixes.addAll(prefixesToRemove);
        taglibPrefixes.removeAll(prefixesToRemove);
      }
    }
    stats.addUsedPrefixes(usedPrefixes);
    stats.addUnusedPrefixes(file, taglibPrefixes);
  }

  private Set<String> getDeclaredTaglibs(Path file) throws IOException {
    Set<String> taglibPrefixes = new HashSet<>();
    try (FileReader fr = new FileReader(file.toFile());
         BufferedReader br = new BufferedReader(fr)) {
      while (br.ready()) {
        String line = br.readLine();
        // handle case: <%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>
        if (line.contains("taglib") && line.contains("tagdir")) {
          int prefixStart = line.indexOf("prefix=\"") + 8;
          int prefixEnd = line.indexOf("\"", prefixStart);
          taglibPrefixes.add(line.substring(prefixStart, prefixEnd));
        }
        // handle case: xmlns:fmt="http://java.sun.com/jsp/jstl/fmt"
        else if (line.contains("xmlns:")) {
          int prefixStart = line.indexOf("xmlns:") + 6;
          int prefixEnd = line.indexOf("=", prefixStart);
          taglibPrefixes.add(line.substring(prefixStart, prefixEnd));
        }
      }
      return taglibPrefixes;
    }
  }

  public static enum RunType {
    FILE("-f"),
    DIRECTORY("-d");
    private String _typeStr;
    private RunType(String typeStr) {
      _typeStr = typeStr;
    }
    public static boolean isRunTypeStr(String s) {
      return (getRunType(s) != null);
    }
    public static RunType getRunType(String s) {
      for (RunType type : values()) {
        if (type._typeStr.equals(s)) return type;
      }
      return null;
    }
  }

  public static class Config {
    private final RunType _runType;
    private final Path _path;
    public Config(RunType runType, Path path) { _runType = runType; _path = path; }
    public RunType getRunType() { return _runType; }
    public Path getPath() { return _path; }
  }

  private static Config parseArgs(String[] args) {
    if (args.length == 2 && args[1].length() > 0 &&
        RunType.isRunTypeStr(args[0])) {
      RunType runType = RunType.getRunType(args[0]);
      Path path = Paths.get(args[1]);
      if ((runType.equals(RunType.DIRECTORY) && Files.isDirectory(path)) ||
          (runType.equals(RunType.FILE) && Files.isRegularFile(path))) {
        return new Config(runType, path);
      }
    }
    System.err.println("USAGE: fgpJava " + TagLibStatistics.class.getName() + " [-d|-f] <path>");
    System.err.println("     -f -> find taglib behavior in the file passed");
    System.err.println("     -d -> recursively search .jsp and .tag files in a directory (ignores .svn)");
    System.exit(1);
    return null;
  }
}
