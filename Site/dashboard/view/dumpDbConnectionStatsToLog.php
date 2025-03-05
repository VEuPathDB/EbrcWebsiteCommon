<?php
/**
 * Action page to dump database connection stats
 * to Tomcat log.
 *
 * $dbclass is 'UserDB' or 'AppDB'
 */
$oc = new lib\modules\OpenConnections();

if (isset($_POST['dbclass'])) {
  if ($oc->dumpDbConnectionStatsToLog($_POST['dbclass'])) {
    print 'ok';
  } else {
    print "<span class='warn'>error</span>";
  }
}
