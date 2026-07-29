<?php
/**
 * View of database stats
 */

// use lib\LdapTnsNameResolver;
use lib\LdapPostgresNameResolver;
use lib\modules\ {
  Database,
  DBInstances,
  TuningManagerStatus,
  WorkflowStatus,
};

// $ldap_resolver = new LdapTnsNameResolver();
$ldap_resolver = new LdapPostgresNameResolver();
$tuning_manager_status = new TuningManagerStatus();

$workflow_status = new WorkflowStatus();

$db_instances_obj = new DBInstances();
$db_instances_attribs = $db_instances_obj->attributes();
$db_instances_str = $db_instances_attribs['DbInstanceNames'];
$db_names = explode(',', $db_instances_str);

?>
<script>
  $(function () {
    $('#tuningTables').DataTable({
      'stateSave': false,
      'stripeClasses': ['rowMedium', 'rowLight'],
      'orderClasses': false,
      'order': [1, 'desc'],
      'pageLength': 10,
    });
  });
</script>

<p>
  <b><a href="?p=DB%20Connection%20Pool">Connection pool activity</a></b>
</p>
<?php
/**
 * Loop through available DBs by name and display attributes for each
 */
foreach ($db_names as $db_name) {
$database = new Database($db_name);
$db_display_name = ucfirst(strtolower($db_name));

if (isset($_GET['refresh']) && $_GET['refresh'] == 1) {
  $success = $database->refresh();

  if (!$success)
    echo "<span class='fatal'>FAILED TO REFRESH</span>";
}

$adb = $database->attributes();
// $adb_aliases_ar = []; /* $ldap_resolver->resolve($adb['service_name']);*/
$adb_aliases_ar =  $ldap_resolver->resolve($adb['db_name']);
// postgres does not report the server it runs on, so ask LDAP instead
$adb_host = $ldap_resolver->resolveHost($adb['db_name']);
$tuning_status_attrs = $tuning_manager_status->attributes();

$workflow_status_attrs = $workflow_status->attributes();
?>

<h2><?= $db_display_name ?> Database</h2>

<table class="p">
  <tr>
    <td><b>Dbname:</b></td>
    <td class="p"><?= strtolower($adb['db_name']) ?></td>
  </tr>
  <tr>
    <td><b>Aliases:</b></td>
    <td class="p"><?= implode(", ", $adb_aliases_ar) ?></td>
  </tr>
  <tr>
    <td><b>Hosted on:</b></td>
    <td class="p"><?= $adb_host === null ? 'unknown' : strtolower($adb_host) ?></td>
  </tr>
  <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr>
    <td><b>Size on disk:</b></td>
    <td class="p"><?= $adb['dbf_gb_on_disk'] ?></td>
  </tr>
  <tr>
    <td><b>Version:</b></td>
    <td class="p"><?= $adb['version'] ?></td>
  </tr>
  <tr>
    <td><b>Character encoding:</b></td>
    <td class="p"><?= $adb['character_encoding'] ?></td>
  </tr>
  <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr>
    <td><b>Client login name:</b></td>
    <td class="p"><?= strtolower($adb['login']) ?></td>
  </tr>
  <tr>
    <td><b>Client connecting from:</b></td>
    <td class="p"><?= strtolower($adb['client_host']) ?></td>
  </tr>
</table>

<?php $dblink_map = $adb['DblinkList']; ?>
<?php if (empty($dblink_map)) { ?>
<p><b>Available DBLinks</b>: None</p>
<?php } else { ?>
<p><b>Available DBLinks</b>:</p>
<div class="table-scroll">
<table class="dbinfo">
  <thead>
  <tr class="secondary3">
    <th>server</th>
    <th>type</th>
    <th>options</th>
    <th>schemas</th>
  </tr>
  </thead>
  <tbody>
  <?php
  $row = 0;
  foreach ($dblink_map as $dblink) {
    $css_class = ($row % 2) ? "rowMedium" : "rowLight";
    ?>
    <tr class="<?= $css_class ?>">
      <td><?= strtolower($dblink['server_name']) ?></td>
      <td><?= strtolower($dblink['foreign_data_wrapper']) ?></td>
      <td><?= strtolower($dblink['options']) ?></td>
      <td><?= strtolower($dblink['schemas']) ?></td>
    </tr>
    <?php
    $row++;
  }
  ?>
  </tbody>
</table>
</div>
<?php } ?>

<hr/>
<p><b>Information on this page was last updated</b>: <?= $adb['system_date'] ?></p>
<form method="GET" action="">
  <input name="refresh" type="hidden" value="1">
  <input type="submit" value="update now">
</form>

  <?php } ?>
  <!-- End DB sections -->

<h2>Custom Tuning</h2>
<p class="clickable">Tuning Tables &#8593;&#8595;</p>
<div class="expandable">

  <?php $days_old_warning_threshold = 5; ?>

  <p>
    Color codes: <span class='fatal'>update failed</span>,
    <span class='warn'>last_check older than <?= $days_old_warning_threshold ?> days</span>
  </p>
  <div style="display: inline-block; padding-left: 10px;"><!-- constrain jquery datatables -->
    <table id="tuningTables" class="display">
      <thead>
      <tr class="secondary3">
        <th>name</th>
        <th>last_check</th>
        <th>status</th>
        <th>created</th>
      </tr>
      </thead>
      <tbody>
      <?php
      $tm_status_map = array_key_exists('table_statuses', $tuning_status_attrs)
        ?
        $tuning_status_attrs['table_statuses']
        :
        [];
      $row = 0;
      foreach ($tm_status_map as $table) {

        $now = time();
        $last_check_ts = strtotime($table['last_check']);
        $seconds_diff = $now - $last_check_ts;
        $days_diff = $seconds_diff / 60 / 60 / 24;

        if ($days_diff > $days_old_warning_threshold) {
          $cell_css_class = "class='warn'";
        } else if (stripos($table['status'], 'fail') !== false) {
          $cell_css_class = "class='fatal'";
        } else {
          $cell_css_class = '';
        }
        ?>
        <tr>
          <td <?= $cell_css_class ?>><?= $table['name'] ?></td>
          <td <?= $cell_css_class ?>><?= $table['last_check'] ?></td>
          <td <?= $cell_css_class ?>><?= $table['status'] ?></td>
          <td <?= $cell_css_class ?>><?= $table['created'] ?></td>
        </tr>
        <?php
      }
      ?>


      </tbody>
    </table>
  </div> <!-- constrain jquery datatables -->
</div> <!-- div expandable -->


<!-- JB Start -->
<h2>Workflow Status</h2>
<p class="clickable">Workflow Status &#8593;&#8595;</p>
<div class="expandable">

  <div style="display: inline-block; padding-left: 10px;"><!-- constrain jquery datatables -->
    <table id="workflow" class="display">
      <thead>
      <tr class="secondary3">
        <th>step</th>
        <th>off_line</th>
        <th>state</th>
      </tr>
      </thead>
      <tbody>
      <?php
      $wf_status_map = array_key_exists('table_statuses', $workflow_status_attrs)
        ?
        $workflow_status_attrs['table_statuses']
        :
        [];
      $row = 0;
      foreach ($wf_status_map as $table) {
        ?>
        <tr>
          <td><?= $table['step'] ?> </td>
          <td><?= $table['off_line'] ?></td>
          <td><?= $table['state'] ?></td>
        </tr>
        <?php
      }
      ?>
      </tbody>
    </table>
  </div> <!-- constrain jquery datatables -->
</div> <!-- div expandable -->


<!-- JB END -->

