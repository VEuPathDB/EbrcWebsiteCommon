<?php
/**
 * Information about microservices deployed on this machine (may or may not be attached to this particular website)
 * @package View
 */

$pconf=file_get_contents("/home/rdoherty/pconfLatest.json");
$json=json_decode($pconf, true);
$stacks=$json["stacks"];
?>
<script>
  $( function() {
    $( "#stackTabs" ).tabs();
  } );
</script>

<h2>Microservices on this machine</h2>
<h3>Last Updated: <?php echo htmlspecialchars($json["lastUpdated"]); ?></h3>
<hr/>
<h3>Note: this site may or may not be configured to point at these services

<div id="stackTabs">
  <ul>
    <?php
      foreach ($stacks as $stack => $value) {
        if ($stack != "empty") {
          print("<li><a href=\"#$stack\">$stack</a></li>");
        }
      }
    ?>
  </ul>
  <?php
    foreach ($stacks as $stack => $value) {
      if ($stack != "empty") {
        print("<div id=\"$stack\">");
        print("<script>\n");
        print("  \$( function() { \$( \"#$stack\" ).tabs(); } );\n");
        print("</script>\n");
        print("<b>Services deployed under compose stack: $stack</b>");
        print("<ul>");
        for ($i = 0; $i < count($value) - 1; $i+=2) {
          $serviceName=explode(".", array_keys($value[$i])[0])[0];
          print("<li><a href=\"#$stack$serviceName\">$serviceName</a></li>");
        }
        print("</ul>");
        for ($i = 0; $i < count($value) - 1; $i+=2) {
          $configKey=array_keys($value[$i])[0];
          $serviceName=explode(".", $configKey)[0];
          print("<div id=\"$stack$serviceName\">");
          $config=$value[$i][$configKey];
          $env=$config["Env"];
          unset($config["Env"]);
          $networkKey=array_keys($value[$i+1])[0];
          $network=$value[$i+1][$networkKey];
 
          $envJson=json_encode($env,JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
          $configJson=json_encode($config,JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
          $networkJson=json_encode($network,JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

          // other ways to dump env besides pretty JSON
          //$env=print_r($env,true);
          //$dump=var_dump($env);

          print("<h3>Environment</h3>");
          print("<pre style=\"font-size:0.9em;font-weight:normal\">$envJson</pre>");

          print("<hr/>");

          print("<h3>Other Configuration</h3>");
          print("<pre style=\"font-size:0.9em;font-weight:normal\">$configJson</pre>");

          print("<hr/>");

          print("<h3>Network Settings</h3>");
          print("<pre style=\"font-size:0.9em;font-weight:normal\">$networkJson</pre>");

          print("</div>");
        }
        print("</div>");
      }
    }
  ?>
</div>
