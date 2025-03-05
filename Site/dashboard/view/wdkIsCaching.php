<?php
/**
 * Action page to toggle the WDK global database cache on/off
 */
$cache = new lib\modules\WdkCache();

if (isset($_POST['toggle']) && $_POST['toggle'] == 1) {
  $cache->toggleWdkIsCaching();
}

// Get attributes AFTER any call to toggleWdkIsCaching() !!
$cattr = $cache->attributes();

// print current value (highlight with color if caching is disabled)
if (!$cattr['WdkIsCaching'])
  echo "<span class='fatal'>";

var_export($cattr['WdkIsCaching']);

if (!$cattr['WdkIsCaching'])
  echo "</span>";
