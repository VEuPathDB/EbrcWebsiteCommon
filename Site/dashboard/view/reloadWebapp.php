<?php
/**
 * Action page to reload the Tomcat webapp.
 */
$webapp = new lib\modules\Webapp();

if (isset($_POST['reload']) && $_POST['reload'] == 1) {
  $webapp->reload();
}

echo $webapp->uptime_as_text();
