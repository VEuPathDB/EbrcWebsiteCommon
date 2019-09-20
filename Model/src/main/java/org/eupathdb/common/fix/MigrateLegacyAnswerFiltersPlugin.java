package org.eupathdb.common.fix;

import static org.gusdb.fgputil.json.JsonUtil.Jackson;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;
import org.gusdb.fgputil.FormatUtil;
import org.gusdb.fgputil.FormatUtil.Style;
import org.gusdb.fgputil.functional.Result;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.answer.spec.ParamsAndFiltersDbColumnFormat;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowUpdaterPlugin;
import org.gusdb.wdk.model.fix.table.TableRowUpdater;
import org.gusdb.wdk.model.fix.table.steps.StepData;
import org.gusdb.wdk.model.fix.table.steps.StepDataFactory;
import org.gusdb.wdk.model.fix.table.steps.StepDataWriter;
import org.gusdb.wdk.model.toolbundle.filter.ColumnFilterConfigStyle;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Parses the organism name or sequence type from a steps answer_filter value
 * and converts it into a column filter configuration.
 * <p>
 * The {@code write} flag must be set for this plugin to perform any updates.
 */
public class MigrateLegacyAnswerFiltersPlugin implements TableRowUpdaterPlugin<StepData> {

  private static final Logger LOG = LogManager.getLogger(MigrateLegacyAnswerFiltersPlugin.class);

  private static final String
    COL_ORGANISM      = "organism",
    COL_SEQUENCE      = "sequence_type",
    KEY_COL_FILTER    = ParamsAndFiltersDbColumnFormat.KEY_COLUMN_FILTERS,
    KEY_VALUES_CONFIG = ColumnFilterConfigStyle.VALUES.getRequiredPropertyName(),
    DEFAULT_TOOL      = "byValue", //Should match the default column tool bundle name
    INSTANCES_SUFFIX   = "_instances",
    GENES_SUFFIX      = "_genes";

  /**
   * Mapping of sequence answer filter values to sequence types
   */
  // Mapping provided in https://redmine.apidb.org/issues/35278
  private static final Map<String, String> SEQUENCE_TYPE_MAPPING = new HashMap<>(){{
    put("apicoplast", "apicoplast_chromosome");
    put("chromosomes", "chromosome");
    put("contigs", "contig");
    put("mitochondria", "mitochondrial_chromosome");
    put("supercontigs", "supercontig");
  }};

  /**
   * Process stats tracker
   */
  private final MLAFStats stats;

  /**
   * Whether or not to perform any updates
   */
  private boolean performUpdates;

  public MigrateLegacyAnswerFiltersPlugin() {
    stats = new MLAFStats();
  }

  @Override
  public void configure(
    final WdkModel     wdkModel,
    final List<String> additionalArgs
  ) throws Exception {
    LOG.info("Using organism mapping :" + FormatUtil.NL +
        FormatUtil.prettyPrint(OrganismMapping.MAPPING, Style.MULTI_LINE));
    performUpdates = !additionalArgs.isEmpty()
      && additionalArgs.get(0).equals("-write");
  }

  @Override
  public TableRowUpdater<StepData> getTableRowUpdater(final WdkModel wdkModel) {
    return new TableRowUpdater<>(new MLAFRowSelector(),
      new StepDataWriter(), this, wdkModel);
  }

  @Override
  public RowResult<StepData> processRecord(final StepData row) {
    MLAFPair sorted = categorize(row);

    stats.read.incrementAndGet();

    // Not a usable row, skip it.
    if (sorted.type == MLAFRowType.OTHER) {
      stats.unrecognized.incrementAndGet();
      return debug(new RowResult<>(row).setShouldWrite(false),
        "Row " + stats.read + " invalid, skipping.");
    }

    var column = sorted.type == MLAFRowType.ORGANISM
      ? COL_ORGANISM
      : COL_SEQUENCE;

    var updated = mergeFilterConfig(column, sorted.name, row.getParamFilters());

    if (updated)
      if (sorted.type == MLAFRowType.ORGANISM)
        stats.organism.incrementAndGet();
      else
        stats.sequence.incrementAndGet();
    else
      stats.skipped.incrementAndGet();

    return debug(
      new RowResult<>(row).setShouldWrite(updated && performUpdates),
      "Row " + stats.read.get() + ": shouldWrite = "
        + (updated && performUpdates)
    );
  }

  @Override
  public void dumpStatistics() {
    LOG.info(Result.of(() -> Jackson.writeValueAsString(stats))
      .mapError(RuntimeException::new)
      .valueOrElseThrow());
  }

  /**
   * Parses and sorts the given step data into 1 of the following 3 categories
   * and provides additional data as defined below:
   * <dl>
   * <dt>{@link MLAFRowType#ORGANISM}</dt>
   * <dd>Provides the real organism name for the given step data</dd>
   * <dt>{@link MLAFRowType#SEQUENCE}</dt>
   * <dd>Provides a valid sequence type for the given step data</dd>
   * <dt>{@link MLAFRowType#OTHER}</dt>
   * <dd>Returns null as the given row should be skipped.</dd>
   * </dl>
   *
   * @param rec
   *   row to categorize
   *
   * @return A tuple of data matching one of the above 3 sort categories.
   */
  private MLAFPair categorize(final StepData rec) {
    // Both sides lowercased for matching.
    var afName = rec.getLegacyAnswerFilter().toLowerCase();

    if (!afName.endsWith(INSTANCES_SUFFIX) && !afName.endsWith(GENES_SUFFIX)) {
      // If the row does not end with '_instances' or '_genes' and is
      // not a sequence type filter then it can be skipped.
      return debug(
        SEQUENCE_TYPE_MAPPING.containsKey(afName)
          ? new MLAFPair(MLAFRowType.SEQUENCE, afName)
          : new MLAFPair(MLAFRowType.OTHER, null),
        "Categorized input '" + afName + "' as %s"
      );
    }

    var orgName = parseOrganismName(trimSuffix(afName));

    return debug(
      null == orgName
        ? new MLAFPair(MLAFRowType.OTHER, null)
        : new MLAFPair(MLAFRowType.ORGANISM, orgName),
      "Categorized input '" + afName + "' as %s"
    );
  }

  /**
   * Attempts to parse the given String to find an organism name.
   * <p>
   * Trims the string down to the last segment and matches that segment against
   * the {@link #ABBREV_TO_ORGANISM}.  If a match was found returns that match, else
   * increase the size of the segment and try again.  If no match can be found
   * {@code null} is returned.
   * <p>
   * Segments are divided by an underscore character, however a segment may also
   * contain one or more underscore characters so the matching is done as
   * described by the following example:
   * <p>
   /* Given the string "foo_bar_fizz"
   * <pre>
   *   if (map.contains("fizz"))
   *     return map.get("fizz")
   *   if (map.contains("bar_fizz"))
   *     return map.get("bar_fizz")
   *   if (map.contains("foo_bar_fizz"))
   *     return map.get("foo_bar_fizz")
   *   return null
   * </pre>
   *
   * @param filter
   *   filter name string
   *
   * @return the organism name matching the given filter (if such a match was
   *   found) else null.
   */
  private String parseOrganismName(final String filter) {
    for(var i = filter.lastIndexOf('_'); i > -1; i = filter.lastIndexOf('_', i - 1)) {
      var sub = filter.substring(i+1);
      var org = OrganismMapping.MAPPING.get(sub);

      if (null != org)
        return debug(org, "Matched abbrev " + sub + " to organism %s");
    }

    // got through substrings; check whole string
    var org = OrganismMapping.MAPPING.get(filter);
    if (null != org) {
      return debug(org, "Matched abbrev " + filter + " to organism %s");
    }

    return debug(null, "Could not match an organism for answer_filter value " + filter);
  }

  /**
   * Remove the {@link #INSTANCES_SUFFIX} from the end of the given input
   * string.
   *
   * @param filter
   *   filter name string
   *
   * @return input filter name string minus the {@link #INSTANCES_SUFFIX} string.
   */
  private static String trimSuffix(final String filter) {
    if (filter.endsWith(GENES_SUFFIX))
      return filter.substring(0, filter.length() - GENES_SUFFIX.length());
    if (filter.endsWith(INSTANCES_SUFFIX))
      return filter.substring(0, filter.length() - INSTANCES_SUFFIX.length());
    return filter;
  }

  /**
   * Updates the given display param json object with a new column filter config
   * for the given column and value.
   *
   * @param column
   *   column on which the filter should be applied
   * @param value
   *   value to filter on
   * @param paramsAndFilters
   *   display params json to update
   */
  private static boolean mergeFilterConfig(
    final String column,
    final String value,
    final JSONObject paramsAndFilters
  ) {
    var columnFilters = require(KEY_COL_FILTER, paramsAndFilters, JSONObject::new);
    var filterConfigs = require(column, columnFilters, JSONObject::new);

    // Skip if this column already has this filter applied
    if (filterConfigs.has(DEFAULT_TOOL)) {
        return debug(false, "Step display params already has a column filter"
          + "configured for value " + value + " on column " + column);
    }
    filterConfigs.put(DEFAULT_TOOL, debug(
      new JSONObject().put(KEY_VALUES_CONFIG, new JSONArray().put(value)),
      "Configured display params with column filter %s on column " + column
    ));

    return true;
  }

  /**
   * Returns an instance of T and guarantees that instance appears in the given
   * map identified by the given key.
   * <p>
   * If the map did not previously contain an entry at the given key, the
   * provider will be used to construct a new instance of T which will be
   * inserted into the given map then returned to the caller.
   *
   * @param key
   *   key to lookup
   * @param map
   *   map on which to perform lookup
   * @param def
   *   default value provider
   * @param <T>
   *   type of the value to lookup/insert
   *
   * @return an instance of T either from the given map or from the provider
   *   method
   */
  @SuppressWarnings("unchecked") // Internal use only
  private static <T> T require(
    final String      key,
    final JSONObject  map,
    final Supplier<T> def
  ) {
    if (map.has(key))
      return (T) map.get(key);
    var val = def.get();
    map.put(key, val);
    return val;
  }

  /**
   * Writes the given message formatted with the given value to the debug log
   * then returns the value.
   *
   * @param val
   *   passthrough value
   * @param message
   *   message to write to the debug log.  Message may be parameterized with a
   *   single format insert which will be filled by {@code val}
   * @param <T>
   *   passthrough value type
   *
   * @return the input {@code val}
   */
  private static <T> T debug(final T val, final String message) {
    LOG.debug(String.format(message, val));
    return val;
  }
}

class MLAFRowSelector extends StepDataFactory {

  MLAFRowSelector() {
    super(false);
  }

  @Override
  public String getRecordsSql(String schema, String projectId) {
    return "SELECT\n"
      + "  " + SELECT_COLS_TEXT + "\n"
      + getMiddleSql(schema);
  }

  public String getMiddleSql(String schema) {
    return "FROM\n"
        + "  " + schema + "steps s\n"
        + (_includeGuestUserSteps
        ? ""
        : "  INNER JOIN " + schema + "users u\n"
          + "    ON s.user_id = u.user_id\n")
        + "WHERE\n"
        + "  is_deleted = 0\n"
        + (_includeGuestUserSteps ? "" : "  AND u.is_guest = 0\n")
        + "  AND answer_filter IS NOT NULL\n"
        + "  AND answer_filter NOT LIKE 'all\\_%' ESCAPE '\\'\n"
        + "  AND answer_filter NOT LIKE '%distinct\\_genes' ESCAPE '\\'\n"
        + "  AND answer_filter NOT LIKE '%\\_groups' ESCAPE '\\'\n"
        + "  AND answer_filter NOT LIKE '%distinct\\_gene\\_instances' ESCAPE '\\'";
  }
}

enum MLAFRowType {
  SEQUENCE,
  ORGANISM,
  OTHER
}

class MLAFStats {
  public AtomicInteger read = new AtomicInteger();
  public AtomicInteger organism = new AtomicInteger();
  public AtomicInteger sequence = new AtomicInteger();
  public AtomicInteger unrecognized = new AtomicInteger();
  public AtomicInteger skipped = new AtomicInteger();
}

class MLAFPair {
  final MLAFRowType type;
  final String name;

  public MLAFPair(MLAFRowType type, String name) {
    this.type = type;
    this.name = name;
  }

  @Override
  public String toString() {
    return new JSONObject()
      .put("name", name)
      .put("type", type)
      .toString();
  }
}

/**
 * Map containing entries consisting of a key of an organism's public
 * abbreviation mapped to a value of that organism's name. Used the following
 * SQL on app DBs named below to generate this mapping:
 *
 * SELECT 'put("' || lower(public_abbrev) || '", "' || organism_name || '");' as name
 * FROM apidbtuning.organismattributes
 * ORDER BY name asc;
 */
class OrganismMapping {
  public static Map<String,String> MAPPING = new LinkedHashMap<>() {{
    // pulled from eupa045n
    put("aacuatcc16872", "Aspergillus aculeatus ATCC 16872");
    put("aalgpra109", "Anncaliia algerae PRA109");
    put("aalgpra339", "Anncaliia algerae PRA339");
    put("aalgundeen", "Anncaliia algerae Undeen");
    put("aastapo3", "Aphanomyces astaci strain APO3");
    put("aastunknown", "Acanthamoeba astronyxis Unknown");
    put("abracbs101740", "Aspergillus brasiliensis CBS 101740");
    put("acamibt28561", "Aspergillus campestris IBT 28561");
    put("acan2vrr", "Albugo candida 2VRR");
    put("acaritem5010", "Aspergillus carbonarius ITEM 5010");
    put("acasma", "Acanthamoeba castellanii Ma");
    put("acasneff", "Acanthamoeba castellanii str. Neff");
    put("aclanrrl1", "Aspergillus clavatus NRRL 1");
    put("acspgalka", "Acanthamoeba sp Galka");
    put("acspincertae_sedis", "Acanthamoeba sp Incertae sedis");
    put("acspt4b-type", "Acanthamoeba sp T4b-type");
    put("acula1", "Acanthamoeba culbertsoni A1");
    put("afisnrrl181", "Aspergillus fischeri NRRL 181");
    put("aflanrrl3357", "Aspergillus flavus NRRL3357");
    put("afuma1163", "Aspergillus fumigatus A1163");
    put("afumaf293", "Aspergillus fumigatus Af293");
    put("aglacbs516.65", "Aspergillus glaucus CBS 516.65");
    put("ainvnjm9701", "Aphanomyces invadans NJM9701");
    put("akawifo4308", "Aspergillus kawachii IFO 4308");
    put("alainc14", "Albugo laibachii Nc14");
    put("alenpd2s", "Acanthamoeba lenticulata PD2S");
    put("aluccbs106.47", "Aspergillus luchuensis CBS 106.47");
    put("alugl3a", "Acanthamoeba lugdunensis L3a");
    put("amacatcc38327", "Allomyces macrogynus ATCC 38327");
    put("amau1652", "Acanthamoeba mauritaniensis 1652");
    put("amutuamh3576", "Amauroascus mutatus isolate UAMH 3576");
    put("anidfgsca4", "Aspergillus nidulans FGSC A4");
    put("anigatcc1015", "Aspergillus niger ATCC 1015");
    put("anigatcc13496", "Aspergillus niger ATCC 13496");
    put("anigcbs513-88", "Aspergillus niger CBS 513.88");
    put("anign402atcc64974", "Aspergillus niger strain N402 (ATCC64974)");
    put("aniguamh3544", "Amauroascus niger isolate UAMH 3544");
    put("anovibt16806", "Aspergillus novofumigatus IBT 16806");
    put("aochibt24754", "Aspergillus ochraceoroseus IBT 24754");
    put("aoryrib40", "Aspergillus oryzae RIB40");
    put("apalreich", "Acanthamoeba palestinensis Reich");
    put("aquivil3", "Acanthamoeba quina Vil3");
    put("arhysingh", "Acanthamoeba rhysodes Singh");
    put("aspwsbs2006", "Amphiamblys sp. WSBS2006");
    put("asteibt23096", "Aspergillus steynii IBT 23096");
    put("asydcbs593.65", "Aspergillus sydowii CBS 593.65");
    put("aternih2624", "Aspergillus terreus NIH2624");
    put("atrish621", "Acanthamoeba triangularis SH621");
    put("atubcbs134.48", "Aspergillus tubingensis CBS 134.48");
    put("avercbs583.65", "Aspergillus versicolor CBS 583.65");
    put("awendto134e9", "Aspergillus wentii DTO 134E9");
    put("azoncbs506.65", "Aspergillus zonatus CBS 506.65");
    put("bayab08-376", "Blechomonas ayalai B08-376");
    put("bbigbond", "Babesia bigemina strain BOND");
    put("bbovt2bo", "Babesia bovis T2Bo");
    put("bceruamh5669", "Byssoonygena ceratinophila isolate UAMH 5669");
    put("bcinb05-10", "Botrytis cinerea B05.10");
    put("bdenjel423", "Batrachochytrium dendrobatidis JEL423");
    put("bdiv1802a", "Babesia divergens strain 1802A");
    put("bmicri", "Babesia microti strain RI");
    put("bovamiyake", "Babesia ovata strain Miyake");
    put("bsallakekonstanz", "Bodo saltans strain Lake Konstanz");
    put("calbsc5314", "Candida albicans SC5314");
    put("calbsc5314_b", "Candida albicans SC5314_B");
    put("calbwo1", "Candida albicans WO-1");
    put("cand30847", "Cryptosporidium andersoni isolate 30847");
    put("caurb8441", "Candida auris strain B8441");
    put("cbaitamu-09q1", "Cryptosporidium baileyi TAMU-09Q1");
    put("ccarksf", "Cladophialophora carrionii KSF");
    put("ccaychn_hen01", "Cyclospora cayetanensis strain CHN_HEN01");
    put("ccaynf1_c8", "Cyclospora cayetanensis isolate NF1_C8");
    put("ccinokay7-130", "Coprinopsis cinerea okayama7#130");
    put("cdeur265", "Cryptococcus deuterogattii R265");
    put("cduob09383", "Candida duobushaemulonis strain B09383");
    put("cfascfcl", "Crithidia fasciculata strain Cf-Cl");
    put("cfelwinnie", "Cytauxzoon felis strain Winnie");
    put("cgatca1873", "Cryptococcus gattii CA1873");
    put("cgatejb2", "Cryptococcus gattii EJB2");
    put("cgatind107", "Cryptococcus gattii VGIV IND107");
    put("cgatnt10", "Cryptococcus gattii NT-10");
    put("cgatwm276", "Cryptococcus gattii WM276");
    put("cgeo1.58", "Cenococcum geophilum 1.58");
    put("cglacbs138", "Candida glabrata CBS 138");
    put("chom30976", "Cryptosporidium hominis isolate 30976");
    put("chom37999", "Cryptosporidium hominis 37999");
    put("chomtu502", "Cryptosporidium hominis TU502");
    put("chomtu502_2012", "Cryptosporidium hominis isolate TU502_2012");
    put("chomudea01", "Cryptosporidium hominis UdeA01");
    put("chomukh1", "Cryptosporidium hominis UKH1");
    put("cimmcbs83496", "Cladophialophora immunda strain CBS 83496");
    put("cimmh538-4", "Coccidioides immitis H538.4");
    put("cimmrmscc2394", "Coccidioides immitis RMSCC 2394");
    put("cimmrmscc3703", "Coccidioides immitis RMSCC 3703");
    put("cimmrs", "Coccidioides immitis RS");
    put("clusatcc42720", "Clavispora lusitaniae ATCC 42720");
    put("cmelukmel1", "Cryptosporidium meleagridis strain UKMEL1");
    put("cmurrn66", "Cryptosporidium muris RN66");
    put("cneob-3501a", "Cryptococcus neoformans var. neoformans B-3501A");
    put("cneoh99", "Cryptococcus neoformans var. grubii H99");
    put("cneojec21", "Cryptococcus neoformans var. neoformans JEC21");
    put("cneokn99", "Cryptococcus neoformans var. grubii KN99");
    put("cparcdc317", "Candida parapsilosis CDC317");
    put("cpariowaii", "Cryptosporidium parvum Iowa II");
    put("cposc735deltsowgp", "Coccidioides posadasii C735 delta SOWgp");
    put("cposcpa0001", "Coccidioides posadasii CPA 0001");
    put("cposcpa0020", "Coccidioides posadasii CPA 0020");
    put("cposcpa0066", "Coccidioides posadasii CPA 0066");
    put("cposrmscc1037", "Coccidioides posadasii RMSCC 1037");
    put("cposrmscc1038", "Coccidioides posadasii RMSCC 1038");
    put("cposrmscc2133", "Coccidioides posadasii RMSCC 2133");
    put("cposrmscc3488", "Coccidioides posadasii RMSCC 3488");
    put("cposrmscc3700", "Coccidioides posadasii RMSCC 3700");
    put("cpossilveira", "Coccidioides posadasii str. Silveira");
    put("cquecbs280.77", "Chrysosporium queenslandicum isolate CBS 280.77");
    put("cspchipmunklx2015", "Cryptosporidium sp. chipmunk LX-2015");
    put("csuiwieni", "Cystoisospora suis strain Wien I");
    put("ctromya3404", "Candida tropicalis MYA-3404");
    put("ctyzuga55", "Cryptosporidium tyzzeri isolate UGA55");
    put("cubi39726", "Cryptosporidium ubiquitum isolate 39726");
    put("cvelccmp2878", "Chromera velia CCMP2878");
    put("eacehoughton", "Eimeria acervulina Houghton");
    put("eaedusnm41457", "Edhazardia aedis USNM 41457");
    put("ebieh348", "Enterocytozoon bieneusi H348");
    put("ebruhoughton", "Eimeria brunetti Houghton");
    put("ecangb1", "Enterospora canceri strain GB1");
    put("ecunec1", "Encephalitozoon cuniculi EC1");
    put("ecunec2", "Encephalitozoon cuniculi EC2");
    put("ecunec3", "Encephalitozoon cuniculi EC3");
    put("ecunecuniii-l", "Encephalitozoon cuniculi EcunIII-L");
    put("ecungbm1", "Encephalitozoon cuniculi GB-M1");
    put("edissaw760", "Entamoeba dispar SAW760");
    put("efalbayerhaberkorn1970", "Eimeria falciformis Bayer Haberkorn 1970");
    put("ehelatcc50504", "Encephalitozoon hellem ATCC 50504");
    put("ehelswiss", "Encephalitozoon hellem Swiss");
    put("ehepth1", "Enterocytozoon hepatopenaei strain TH1");
    put("ehisds4", "Entamoeba histolytica DS4-868");
    put("ehishm1ca", "Entamoeba histolytica HM-1:CA");
    put("ehishm1imss", "Entamoeba histolytica HM-1:IMSS");
    put("ehishm1imss-a", "Entamoeba histolytica HM-1:IMSS-A");
    put("ehishm1imss-b", "Entamoeba histolytica HM-1:IMSS-B");
    put("ehishm3imss", "Entamoeba histolytica HM-3:IMSS");
    put("ehisku27", "Entamoeba histolytica KU27");
    put("ehisku48", "Entamoeba histolytica KU48");
    put("ehisku50", "Entamoeba histolytica KU50");
    put("ehisms96", "Entamoeba histolytica MS96-3382");
    put("ehisrahman", "Entamoeba histolytica Rahman");
    put("eintatcc50506", "Encephalitozoon intestinalis ATCC 50506");
    put("einvip1", "Entamoeba invadens IP1");
    put("emaxweybridge", "Eimeria maxima Weybridge");
    put("emescbs40295", "Exophiala mesophila strain CBS 40295");
    put("emithoughton", "Eimeria mitis Houghton");
    put("emonlv88", "Endotrypanum monterogeii strain LV88");
    put("emoslaredo", "Entamoeba moshkovskii Laredo");
    put("enechoughton", "Eimeria necatrix Houghton");
    put("enutp19", "Entamoeba nuttalli P19");
    put("eolicbs72588", "Exophiala oligosperma strain CBS 72588");
    put("eprahoughton", "Eimeria praecox Houghton");
    put("eromsj2008", "Encephalitozoon romaleae SJ-2008");
    put("etenhoughton", "Eimeria tenella strain Houghton");
    put("ffujimi58289", "Fusarium fujikuroi IMI 58289");
    put("fgraph-1", "Fusarium graminearum PH-1");
    put("foxy26406", "Fusarium oxysporum f. sp. melonis 26406");
    put("foxy4287", "Fusarium oxysporum f. sp. lycopersici 4287");
    put("foxy54006", "Fusarium oxysporum f. sp. cubense tropical race 4 54006");
    put("foxyfo47", "Fusarium oxysporum Fo47");
    put("foxyfosc3a", "Fusarium oxysporum FOSC 3-a");
    put("foxyrace1", "Fusarium oxysporum f. sp. cubense race 1");
    put("foxyrace4", "Fusarium oxysporum f. sp. cubense race 4");
    put("fpedcbs271-37", "Fonsecaea pedrosoi CBS 271.37");
    put("fproet1", "Fusarium proliferatum ET1");
    put("fpronrrl62905", "Fusarium proliferatum strain NRRL62905");
    put("fver7600", "Fusarium verticillioides 7600");
    put("gassa2dh", "Giardia Assemblage A2 isolate DH");
    put("gassaas175", "Giardia assemblage A isolate AS175");
    put("gassawb", "Giardia Assemblage A isolate WB");
    put("gassbbah15c1", "Giardia assemblage B isolate BAH15c1");
    put("gassbgs", "Giardia Assemblage B isolate GS");
    put("gassbgs_b", "Giardia Assemblage B isolate GS_B");
    put("gassep15", "Giardia Assemblage E isolate P15");
    put("gmurrobertsthomson", "Giardia muris strain Roberts-Thomson");
    put("gnipunknown", "Gregarina niphandrodes Unknown strain");
    put("haraemoy2", "Hyaloperonospora arabidopsidis Emoy2");
    put("hcapg186ar", "Histoplasma capsulatum G186AR");
    put("hcapg217b", "Histoplasma capsulatum G217B");
    put("hcaph143", "Histoplasma capsulatum H143");
    put("hcaph88", "Histoplasma capsulatum H88");
    put("hcapnam1", "Histoplasma capsulatum NAm1");
    put("hericanceri", "Hepatospora eriocheir strain canceri");
    put("herigb1", "Hepatospora eriocheir strain GB1");
    put("hhamhh34", "Hammondia hammondi strain H.H.34");
    put("htvaoer-3-3", "Hamiltosporidium tvaerminnensis OER-3-3");
    put("kbescbs10118", "Kwoniella bestiolae CBS 10118");
    put("kdejcbs10117", "Kwoniella dejecticola CBS 10117");
    put("khevcbs569", "Kwoniella heveanensis CBS 569");
    put("laetl147", "Leishmania aethiopica L147");
    put("lamamhombr71973m2269", "Leishmania amazonensis MHOM/BR/71973/M2269");
    put("laralem1108", "Leishmania arabica strain LEM1108");
    put("lbramhombr75m2903", "Leishmania braziliensis MHOM/BR/75/M2903");
    put("lbramhombr75m2904", "Leishmania braziliensis MHOM/BR/75/M2904");
    put("ldonbhu1220", "Leishmania donovani strain BHU 1220");
    put("ldonbpk282a1", "Leishmania donovani BPK282A1");
    put("ldoncl-sl", "Leishmania donovani CL-SL");
    put("ldonlv9", "Leishmania donovani strain LV9");
    put("lenrlem3045", "Leishmania enriettii strain LEM3045");
    put("lgerlem452", "Leishmania gerbilli strain LEM452");
    put("linfjpcm5", "Leishmania infantum JPCM5");
    put("lmajfriedlin", "Leishmania major strain Friedlin");
    put("lmajlv39c5", "Leishmania major strain LV39c5");
    put("lmajsd75.1", "Leishmania major strain SD 75.1");
    put("lmexmhomgt2001u1103", "Leishmania mexicana MHOM/GT/2001/U1103");
    put("lpanmhomcol81l13", "Leishmania panamensis MHOM/COL/81/L13");
    put("lpanmhompa94psc1", "Leishmania panamensis strain MHOM/PA/94/PSC-1");
    put("lprojhh5317", "Lomentospora prolificans JHH-5317");
    put("lpyrh10", "Leptomonas pyrrhocoris H10");
    put("lseyatcc30220", "Leptomonas seymouri ATCC 30220");
    put("lspmarlem2494", "Leishmania sp. MAR LEM2494");
    put("ltarparrottarii", "Leishmania tarentolae Parrot-TarII");
    put("ltrol590", "Leishmania tropica L590");
    put("lturlem423", "Leishmania turanica strain LEM423");
    put("mcircbs277-49", "Mucor circinelloides f. lusitanicus CBS 277.49");
    put("mdapugp3", "Mitosporidium daphniae UGP3");
    put("mglocbs7966", "Malassezia globosa CBS 7966");
    put("mlar98ag31", "Melampsora larici-populina 98AG31");
    put("mory70-15", "Magnaporthe oryzae 70-15");
    put("morybr32", "Magnaporthe oryzae BR32");
    put("nalbjcm2334", "Naganishia albida JCM2334");
    put("nalbnrrly1402", "Naganishia albida NRRL Y-1402");
    put("nausertm2", "Nematocida ausubeli ERTm2");
    put("nausertm6", "Nematocida ausubeli ERTm6");
    put("nbomcq1", "Nosema bombycis CQ1");
    put("ncanliv", "Neospora caninum Liverpool");
    put("ncerbrl01", "Nosema ceranae BRL01");
    put("ncerpa08_1199", "Nosema ceranae strain PA08_1199");
    put("ncraor74a", "Neurospora crassa OR74A");
    put("ndisfgsc8579", "Neurospora discreta FGSC 8579");
    put("ndisjum2807", "Nematocida displodere strain JUm2807");
    put("nfowatcc30863", "Naegleria fowleri ATCC 30863");
    put("nparertm1", "Nematocida parisii ERTm1");
    put("nparertm3", "Nematocida parisii ERTm3");
    put("ntetfgsc2508", "Neurospora tetrasperma FGSC 2508");
    put("ocoloc4", "Ordospora colligata OC4");
    put("padlg01", "Plasmodium adleri G01");
    put("paphdaombr444", "Pythium aphanidermatum DAOM BR444");
    put("parratcc12531", "Pythium arrhenomanes ATCC 12531");
    put("pberanka", "Plasmodium berghei ANKA");
    put("pbilg01", "Plasmodium billcollinsi G01");
    put("pblag01", "Plasmodium blacklocki G01");
    put("pblanrrl1555", "Phycomyces blakesleeanus NRRL 1555(-)");
    put("pbrapb03", "Paracoccidioides brasiliensis Pb03");
    put("pbrapb18", "Paracoccidioides brasiliensis Pb18");
    put("pcaplt1534", "Phytophthora capsici LT1534");
    put("pchachabaudi", "Plasmodium chabaudi chabaudi");
    put("pchrrp-78", "Phanerochaete chrysosporium RP-78");
    put("pcincbs144-22", "Phytophthora cinnamomi var. cinnamomi CBS 144.22");
    put("pcoahackeri", "Plasmodium coatneyi Hackeri");
    put("pconcul13", "Paratrypanosoma confusum CUL13");
    put("pcynb", "Plasmodium cynomolgi strain B");
    put("pcynm", "Plasmodium cynomolgi strain M");
    put("pfal3d7", "Plasmodium falciparum 3D7");
    put("pfal7g8", "Plasmodium falciparum 7G8");
    put("pfalcd01", "Plasmodium falciparum CD01");
    put("pfaldd2", "Plasmodium falciparum Dd2");
    put("pfalga01", "Plasmodium falciparum GA01");
    put("pfalgb4", "Plasmodium falciparum GB4");
    put("pfalgn01", "Plasmodium falciparum GN01");
    put("pfalhb3", "Plasmodium falciparum HB3");
    put("pfalit", "Plasmodium falciparum IT");
    put("pfalke01", "Plasmodium falciparum KE01");
    put("pfalkh01", "Plasmodium falciparum KH01");
    put("pfalkh02", "Plasmodium falciparum KH02");
    put("pfalml01", "Plasmodium falciparum ML01");
    put("pfalsd01", "Plasmodium falciparum SD01");
    put("pfalsn01", "Plasmodium falciparum SN01");
    put("pfaltg01", "Plasmodium falciparum TG01");
    put("pfranilgiri", "Plasmodium fragile strain nilgiri");
    put("pgabg01", "Plasmodium gaboni strain G01");
    put("pgabsy75", "Plasmodium gaboni strain SY75");
    put("pgal8a", "Plasmodium gallinaceum 8A");
    put("pgracrl75-36-700-3", "Puccinia graminis f. sp. tritici CRL 75-36-700-3");
    put("pinft30-4", "Phytophthora infestans T30-4");
    put("pinusanantonio1", "Plasmodium inui San Antonio 1");
    put("pirrdaombr486", "Pythium irregulare DAOM BR486");
    put("piwadaombr242034", "Pythium iwayamai DAOM BR242034");
    put("pjirse8", "Pneumocystis jirovecii SE8");
    put("pknoh", "Plasmodium knowlesi strain H");
    put("pknomalayanpk1a", "Plasmodium knowlesi strain Malayan Strain Pk1 A");
    put("plutpb01", "Paracoccidioides lutzii Pb01");
    put("pmalug01", "Plasmodium malariae UG01");
    put("pneumk1", "Pseudoloma neurophilia strain MK1");
    put("povagh01", "Plasmodium ovale curtisi GH01");
    put("pparinra-310", "Phytophthora parasitica INRA-310");
    put("ppluav1007", "Phytophthora plurivora AV1007");
    put("pprag01", "Plasmodium praefalciparum strain G01");
    put("prampr-102", "Phytophthora ramorum strain Pr102");
    put("preicdc", "Plasmodium reichenowi CDC");
    put("preig01", "Plasmodium reichenowi G01");
    put("prelsgs1-like", "Plasmodium relictum SGS1-like");
    put("prubwisconsin54-1255", "Penicillium rubens Wisconsin 54-1255");
    put("psojp6497", "Phytophthora sojae strain P6497");
    put("ptri1-1bbbdrace1", "Puccinia triticina 1-1 BBBD Race 1");
    put("pultbr650", "Pythium ultimum var. sporangiiferum BR650");
    put("pultdaombr144", "Pythium ultimum DAOM BR144");
    put("pvexdaombr484", "Pythium vexans DAOM BR484");
    put("pvinpettericr", "Plasmodium vinckei petteri strain CR");
    put("pvinvinckeivinckei", "Plasmodium vinckei vinckei strain vinckei");
    put("pvivp01", "Plasmodium vivax P01");
    put("pvivpvl01", "Plasmodium vivax-like Pvl01");
    put("pvivsal1", "Plasmodium vivax Sal-1");
    put("pyoeyoelii17x", "Plasmodium yoelii yoelii 17X");
    put("pyoeyoelii17xnl", "Plasmodium yoelii yoelii 17XNL");
    put("pyoeyoeliiym", "Plasmodium yoelii yoelii YM");
    put("rdelra99-880", "Rhizopus delemar RA 99-880");
    put("rirrdaom181602", "Rhizophagus irregularis DAOM 181602=DAOM 197198");
    put("sapiihem14462", "Scedosporium apiospermum IHEM 14462");
    put("sbra5110", "Sporothrix brasiliensis 5110");
    put("scers288c", "Saccharomyces cerevisiae S288c");
    put("sdicvs20", "Saprolegnia diclina VS20");
    put("sjapyfs275", "Schizosaccharomyces japonicus yFS275");
    put("slop42_110", "Spraguea lophii 42_110");
    put("smack-hell", "Sordaria macrospora k-hell");
    put("sneusn3", "Sarcocystis neurona SN3");
    put("sneusosn1", "Sarcocystis neurona SO SN1");
    put("soctyfs286", "Schizosaccharomyces octosporus yFS286");
    put("sparcbs223-65", "Saprolegnia parasitica CBS 223.65");
    put("spom972h", "Schizosaccharomyces pombe 972h-");
    put("spundaombr117", "Spizellomyces punctatus DAOM BR117");
    put("sreisrz2", "Sporisorium reilianum SRZ2");
    put("ssalatcc50377", "Spironucleus salmonicida ATCC50377");
    put("ssch1099-18", "Sporothrix schenckii 1099-18");
    put("sscl1980uf-70", "Sclerotinia sclerotiorum 1980 UF-70");
    put("tannankara", "Theileria annulata strain Ankara");
    put("tbrugambiensedal972", "Trypanosoma brucei gambiense DAL972");
    put("tbrulister427", "Trypanosoma brucei Lister strain 427");
    put("tbrulister427_2018", "Trypanosoma brucei Lister strain 427 2018");
    put("tbrutreu927", "Trypanosoma brucei brucei TREU927");
    put("tconil3000", "Trypanosoma congolense IL3000");
    put("tcru231", "Trypanosoma cruzi strain 231");
    put("tcrubug2148", "Trypanosoma cruzi Bug2148");
    put("tcruclbrener", "Trypanosoma cruzi strain CL Brener");
    put("tcruclbreneresmeraldo-like", "Trypanosoma cruzi CL Brener Esmeraldo-like");
    put("tcruclbrenernon-esmeraldo-like", "Trypanosoma cruzi CL Brener Non-Esmeraldo-like");
    put("tcrudm28c2014", "Trypanosoma cruzi Dm28c 2014");
    put("tcrudm28c2017", "Trypanosoma cruzi Dm28c 2017");
    put("tcrudm28c2018", "Trypanosoma cruzi Dm28c 2018");
    put("tcruesmeraldo", "Trypanosoma cruzi strain Esmeraldo");
    put("tcrujrcl4", "Trypanosoma cruzi JR cl. 4");
    put("tcrumarinkelleib7", "Trypanosoma cruzi marinkellei strain B7");
    put("tcrusylviox10-1", "Trypanosoma cruzi Sylvio X10/1");
    put("tcrusylviox10-1-2012", "Trypanosoma cruzi Sylvio X10/1-2012");
    put("tcrutcc", "Trypanosoma cruzi TCC");
    put("tcrutulacl2", "Trypanosoma cruzi Tula cl2");
    put("tcruy", "Trypanosoma cruzi strain Y");
    put("tequwa", "Theileria equi strain WA");
    put("tevastib805", "Trypanosoma evansi strain STIB 805");
    put("tgonari", "Toxoplasma gondii ARI");
    put("tgoncast", "Toxoplasma gondii CAST");
    put("tgoncoug", "Toxoplasma gondii COUG");
    put("tgonctco5", "Toxoplasma gondii CtCo5");
    put("tgonfou", "Toxoplasma gondii FOU");
    put("tgongab2-2007-gal-dom2", "Toxoplasma gondii GAB2-2007-GAL-DOM2");
    put("tgongt1", "Toxoplasma gondii GT1");
    put("tgonmas", "Toxoplasma gondii MAS");
    put("tgonme49", "Toxoplasma gondii ME49");
    put("tgonp89", "Toxoplasma gondii p89");
    put("tgonrh", "Toxoplasma gondii RH");
    put("tgonrub", "Toxoplasma gondii RUB");
    put("tgontgcatbr5", "Toxoplasma gondii TgCATBr5");
    put("tgontgcatbr9", "Toxoplasma gondii TgCATBr9");
    put("tgontgcatprc2", "Toxoplasma gondii TgCatPRC2");
    put("tgontgckug2", "Toxoplasma gondii TgCkUg2");
    put("tgonvand", "Toxoplasma gondii VAND");
    put("tgonveg", "Toxoplasma gondii VEG");
    put("tgraanr4", "Trypanosoma grayi ANR4");
    put("thomunknown", "Trachipleistophora hominis Unknown strain");
    put("tmaratcc18224", "Talaromyces marneffei ATCC 18224");
    put("tmesdsm1558", "Tremella mesenterica DSM 1558");
    put("torishintoku", "Theileria orientalis strain Shintoku");
    put("tparmuguga", "Theileria parva strain Muguga");
    put("transc58", "Trypanosoma rangeli SC58");
    put("treeqm6a", "Trichoderma reesei QM6a");
    put("tstiatcc10500", "Talaromyces stipitatus ATCC 10500");
    put("ttheedinburgh", "Trypanosoma theileri isolate Edinburgh");
    put("tvagg3", "Trichomonas vaginalis G3");
    put("tvirgv29-8", "Trichoderma virens Gv29-8");
    put("tvivy486", "Trypanosoma vivax Y486");
    put("umay521", "Ustilago maydis 521");
    put("uree1704", "Uncinocarpus reesii 1704");
    put("vbraccmp3155", "Vitrella brassicaformis CCMP3155");
    put("vcoratcc50505", "Vittaforma corneae ATCC 50505");
    put("vculfloridensis", "Vavraia culicis subsp. floridensis");
    put("ylipclib122", "Yarrowia lipolytica CLIB122");
    put("ylipclib89w29", "Yarrowia lipolytica CLIB89 (W29)");
    put("ztriipo323", "Zymoseptoria tritici IPO323");
    // pulled from host045n
    put("btauhereford", "Bos taurus breed Hereford");
    put("hsapref", "Homo sapiens REF");
    put("mmul17573", "Macaca mulatta isolate 17573");
    put("mmusc57bl6j", "Mus musculus C57BL6J");
    // pulled from schi045n
    put("shaeegypt", "Schistosoma haematobium Egypt");
    put("sjapanhui", "Schistosoma japonicum Anhui");
    put("smanpuertorico", "Schistosoma mansoni Puerto Rico");
    // manually added
    put("3d7", "Plasmodium falciparum 3D7");
    put("tbr927", "Trypanosoma brucei brucei TREU927");
    put("me49", "Toxo gondii ME49");
  }
};
}
