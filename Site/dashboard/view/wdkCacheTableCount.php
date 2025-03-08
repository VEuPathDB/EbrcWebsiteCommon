<?php
/**
 * Action page to reset the WDK database cache
 */

$cache = new lib\modules\WdkCache();

if (isset($_POST['reset']) && $_POST['reset'] == 1) {
  $cache->reset();
}

// Get attributes AFTER any call to reset() !!
$cattr = $cache->attributes();

echo $cattr['cache_table_count'];
