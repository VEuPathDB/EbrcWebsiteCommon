<?php
/**
 * Information about microservices deployed on this machine (may or may not be attached to this particular website)
 * @package View
 */

$stacks=system("bash -c \"sudo pconf | tail -n +15\"");
?>
<script>
  $( function() {
    $( "#stackTabs" ).tabs();
  } );
</script>

<h2>Microservices on this machine</h2>
<h4>Note: this site may or may not be configured to point at these services

<div id="stackTabs">
  <ul>
    <?php
      foreach ($stacks as $stackName) {
        print("<li><a href=\"#$stackName\">$stackName</a></li>");
      }
    ?>
  </ul>
  <?php
    foreach ($stacks as $stackName) {
      print("<div id=\"$stackName\"><p>");
      $stackContent=system("bash -c \"sudo pconf $stackName\"");
      print("</p></div");
    }
  ?>
</div>
