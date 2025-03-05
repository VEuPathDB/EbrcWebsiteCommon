<?php
/**
 * Information about microservices deployed on this machine (may or may not be
 * attached to this particular website)
 */

// FIXME: This is the only location I could find that's both writable by me and readable by apache PHP;
//        For some reason, /tmp, /var/tmp, /var/www/Common/tmp are all unreadable by PHP (??)

$pconfFile = "/home/rdoherty/pconfLatest.json";

$pconf = file_get_contents($pconfFile);
$json = json_decode($pconf, true);
$stacks = $json["stacks"];

?>
<script>
  $(function () {
    $("#stackTabs").tabs();
  });
</script>

<h2>Microservices on this machine</h2>
<h3>Last Updated: <?= htmlspecialchars($json["lastUpdated"]); ?></h3>
<hr/>
<h3>Note: this site may or may not be configured to point at these services</h3>
<div id="stackTabs">
  <ul>
    <?php
    foreach ($stacks as $stack => $value) {
      if ($stack != "empty") {
        echo "<li><a href=\"#$stack\">$stack</a></li>";
      }
    }
    ?>
  </ul>
  <?php
  foreach ($stacks

  as $stack => $value) {
  if ($stack != "empty"): ?>
  <div id="<?= $stack ?>">
    <script>
      $(function () {
        $("#<?=$stack?>").tabs();
      });
    </script>
    <b>Services deployed under compose stack: <?= $stack ?></b>
    <ul>
      <?php
      for ($i = 0; $i < count($value) - 1; $i += 2) {
        $serviceName = explode(".", array_keys($value[$i])[0])[0];
        ?>
        <li><a href="#<?= $stack . $serviceName ?>"><?= $serviceName ?></a></li>";
      <?php } ?>
    </ul>
    <?php
    for ($i = 0;
    $i < count($value) - 1;
    $i += 2) {
    $configKey = array_keys($value[$i])[0];
    $serviceName = explode(".", $configKey)[0];

    echo "<div id=\"$stack$serviceName\">";
    $config = $value[$i][$configKey];
    $env = $config["Env"];
    unset($config["Env"]);

    $networkKey = array_keys($value[$i + 1])[0];
    $network = $value[$i + 1][$networkKey];

    $configJson = json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $networkJson = json_encode($network, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    ?>
    <h3>Environment</h3>
    <table style="font-family:monospace;font-size:0.9em;font-weight:normal">
      <tr>
        <th>Name</th>
        <th>Value</th>
      </tr>
      <?php for ($j = 0; $j < count($env); $j++) {
        $pair = explode("=", $env[$j]);
        echo "<tr><td>$pair[0]</td><td>$pair[1]</td></tr>";
      } ?>
    </table>
    <hr/>
    <h3>Other Configuration</h3>
    <pre style="font-size:0.9em;font-weight:normal"><?= $configJson ?></pre>
    <hr/>
    <h3>Network Settings</h3>
    <pre style="font-size:0.9em;font-weight:normal"><?= $networkJson ?></pre>
<?php } ?>
</div><?php endif;
} ?>
</div>