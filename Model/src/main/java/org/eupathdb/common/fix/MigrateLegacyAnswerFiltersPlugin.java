package org.eupathdb.common.fix;

import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;
import org.gusdb.fgputil.Tuples.TwoTuple;
import org.gusdb.fgputil.functional.Result;
import org.gusdb.wdk.model.WdkModel;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.RowResult;
import org.gusdb.wdk.model.fix.table.TableRowInterfaces.TableRowUpdaterPlugin;
import org.gusdb.wdk.model.fix.table.TableRowUpdater;
import org.gusdb.wdk.model.fix.table.steps.StepData;
import org.gusdb.wdk.model.fix.table.steps.StepDataFactory;
import org.gusdb.wdk.model.fix.table.steps.StepDataWriter;
import org.json.JSONArray;
import org.json.JSONObject;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import static org.gusdb.fgputil.json.JsonUtil.Jackson;

class MLAFRowSelector extends StepDataFactory {

  MLAFRowSelector() {
    super(false);
  }

  @Override
  public String getRecordsSql(String schema, String projectId) {
    return "SELECT\n"
      + "  " + SELECT_COLS_TEXT + "\n"
      + "FROM\n"
      + "  " + schema + "steps s\n"
      + (_includeGuestUserSteps
        ? ""
        : "  INNER JOIN " + schema + "users u\n"
          + "    ON s.user_id = u.user_id\n")
      + "WHERE\n"
      + "  is_deleted = 0\n"
      + "  AND answer_filter IS NOT NULL\n"
      + "  AND answer_filter NOT LIKE 'all\\_%' ESCAPE '\\'\n"
      + "  AND answer_filter NOT LIKE '%\\_genes' ESCAPE '\\'\n"
      + "  AND answer_filter NOT LIKE '%\\_groups' ESCAPE '\\'\n"
      + "  AND answer_filter NOT LIKE '%distinct\\_gene\\_instances' ESCAPE '\\'"
      + (_includeGuestUserSteps ? "" : "\n  AND u.is_guest = 0");
  }
}

enum MLAFRowType {
  SEQUENCE,
  ORGANISM,
  OTHER
}

class MLAFStats {
  public int read;
  public int organism;
  public int sequence;
  public int invalid;
  public int skipped;
}

/**
 * Parses the organism name or sequence type from a steps answer_filter value
 * and converts it into a column filter configuration.
 * <p>
 * The {@code write} flag must be set for this plugin to perform any updates.
 */
public class MigrateLegacyAnswerFiltersPlugin
implements TableRowUpdaterPlugin<StepData> {

  private static final String
    ERR_ORG_FAIL = "Failed to populate organism abbreviation map";

  private static final String
    COL_ORGANISM    = "organism",
    COL_SEQUENCE    = "sequence_type",
    KEY_COL_FILTER  = "columnFilters",
    KEY_FILTER_VAL  = "filter",
    DEFAULT_TOOL    = "histogram", //Should match the default column tool bundle name
    INSTANCE_SUFFIX = "_instances";

  private static final String SQL_ORG_MAPPING = ""
    + "SELECT\n"
    + "  lower(public_abbrev)\n"
    + ", organism_name\n"
    + "FROM apidbtuning.organismattributes";

  private static final Logger LOG = LogManager.getLogger(
    MigrateLegacyAnswerFiltersPlugin.class);

  /**
   * Mapping of public value to organism name.
   */
  private final Map<String, String> abbrToOrg;

  /**
   * Mapping of sequence answer filter values to sequence types
   */
  private final Map<String, String> seqMapping;

  /**
   * Process stats tracker
   */
  private final MLAFStats stats;

  /**
   * Whether or not to perform any updates
   */
  private boolean performUpdates;

  @SuppressWarnings("unused")
  public MigrateLegacyAnswerFiltersPlugin() {
    stats = new MLAFStats();
    abbrToOrg = new HashMap<>();
    // Mapping provided in https://redmine.apidb.org/issues/35278
    seqMapping = Map.copyOf(new HashMap<>(){{
      put("apicoplast", "apicoplast_chromosome");
      put("chromosomes", "chromosome");
      put("contigs", "contig");
      put("mitochondria", "mitochondrial_chromosome");
      put("supercontigs", "supercontig");
    }});
  }

  @Override
  public void configure(
    final WdkModel     wdkModel,
    final List<String> additionalArgs
  ) throws Exception {
    populateOrgMapping(wdkModel);
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
    var sortRes = categorize(row);
    var cat = sortRes.getFirst();
    var val = sortRes.getSecond();

    stats.read++;

    // Not a usable row, skip it.
    if (cat == MLAFRowType.OTHER) {
      stats.invalid++;
      return debug(new RowResult<>(row).setShouldWrite(false),
        "Row " + stats.read + " invalid, skipping.");
    }

    var column = cat == MLAFRowType.ORGANISM
      ? COL_ORGANISM
      : COL_SEQUENCE;

    var updated = mergeFilterConfig(column, val, row.getParamFilters());

    if (updated)
      if (cat == MLAFRowType.ORGANISM)
        stats.organism++;
      else
        stats.sequence++;
    else
      stats.skipped++;

    return debug(
      new RowResult<>(row).setShouldWrite(updated && performUpdates),
      "For row " + stats.read + " shouldWrite set to " + (updated && performUpdates)
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
  private TwoTuple<MLAFRowType, String> categorize(final StepData rec) {
    // Both sides lowercased for matching.
    var afName = rec.getLegacyAnswerFilter()
      .toLowerCase();

    if (!afName.endsWith(INSTANCE_SUFFIX))
      // If the row does not end with '_instances' and is
      // not a sequence type filter then it can be skipped.
      return debug(
        seqMapping.containsKey(afName)
          ? new TwoTuple<>(MLAFRowType.SEQUENCE, afName)
          : new TwoTuple<>(MLAFRowType.OTHER, null),
        "categorized " + afName + " as %s"
      );

    var orgName = parseOrganismName(trimSuffix(afName));

    return debug(
      null == orgName
        ? new TwoTuple<>(MLAFRowType.OTHER, null)
        : new TwoTuple<>(MLAFRowType.ORGANISM, orgName),
      "categorized " + afName + " as %s"
    );
  }

  /**
   * Attempts to parse the given String to find an organism name.
   * <p>
   * Trims the string down to the last segment and matches that segment against
   * the {@link #abbrToOrg}.  If a match was found returns that match, else
   * increase the size of the segment and try again.  If no match can be found
   * {@code null} is returned.
   * <p>
   * Segments are divided by an underscore character, however a segment may also
   * contain one or more underscore characters so the matching is done as
   * described by the following example:
   * <p>
   * Given the string "foo_bar_fizz"
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
    for(var i = filter.lastIndexOf('_'); i > -1; i = filter.lastIndexOf('_', i)) {
      var sub = filter.substring(i);
      var org = abbrToOrg.get(sub);

      if (null != org)
        return debug(org, "Matched abbrev " + sub + " to organism %s");
    }

    return debug(null, "Could not match an organism for answer_filter value "
      + filter);
  }

  /**
   * Populates the given map with entries consisting of a key of an organism's
   * public abbreviation mapped to a value of that organism's name.
   *
   * @param wdkModel
   *   model to use to retrieve organism data
   *
   * @throws WdkModelException
   *   if the organism mapping could not be populated.
   */
  private void populateOrgMapping(
    final WdkModel wdkModel
  ) throws WdkModelException {
    try (
      var con  = wdkModel.getAppDb().getDataSource().getConnection();
      var stmt = con.createStatement();
      var res  = stmt.executeQuery(SQL_ORG_MAPPING)
    ) {
      while (res.next())
        abbrToOrg.put(res.getString(1), res.getString(2));
    } catch (SQLException e) {
      throw new WdkModelException(ERR_ORG_FAIL, e);
    }
  }

  /**
   * Remove the {@link #INSTANCE_SUFFIX} from the end of the given input
   * string.
   *
   * @param filter
   *   filter name string
   *
   * @return input filter name string minus the {@link #INSTANCE_SUFFIX} string.
   */
  private static String trimSuffix(final String filter) {
    return filter.substring(0, filter.length() - INSTANCE_SUFFIX.length());
  }

  /**
   * Updates the given display param json object with a new column filter config
   * for the given column and value.
   *
   * @param column
   *   column on which the filter should be applied
   * @param value
   *   value to filter on
   * @param params
   *   display params json to update
   */
  private static boolean mergeFilterConfig(
    final String column,
    final String value,
    final JSONObject params
  ) {
    var tools = require(KEY_COL_FILTER, params, JSONObject::new);
    var filts = require(column, tools, JSONObject::new);
    var confs = require(DEFAULT_TOOL, filts, JSONArray::new);

    // Skip if this column already has this filter applied
    for (var i = 0; i < confs.length(); i++)
      if (value.equals(confs.getJSONObject(i).get(KEY_FILTER_VAL)))
        return debug(false, "Step display params already has a column filter"
          + "configured for value " + value + " on column " + column);


    confs.put(debug(
      new JSONObject()
        .put(KEY_FILTER_VAL, value),
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
