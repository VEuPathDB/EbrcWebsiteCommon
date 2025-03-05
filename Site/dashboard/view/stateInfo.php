<?php
/**
 * Information about the WDK cache.
 */

use lib\modules\ {
  ModelConfig,
  WdkCache,
  WdkMeta,
  Webapp,
};

$cattr = (new WdkCache())->attributes();
$model_data_tree = (new ModelConfig())->attributes();
$meta_data = (new WdkMeta())->attributes();
$webapp = new Webapp();
?>

<h2>Model</h2>
<p><i>Data provided by org.gusdb.wdk.model.WdkModel</i></p>
<b>Project ID (Model Name): </b><?= $meta_data['ProjectId']; ?><br>
<b>Display Name (Product Name): </b><?= $meta_data['DisplayName']; ?><br>
<b>Model Version: </b><?= $meta_data['ModelVersion']; ?><br>
<b>Build Number: </b><?= $meta_data['BuildNumber']; ?><br>
<b>Release Date: </b><?= $meta_data['ReleaseDate']; ?><br>
<b>GUS Home: </b><?= $meta_data['GusHome']; ?><br>

<h2>Cache</h2>

<b>Cache table count: </b><span id="cache_table_count"><?= $cattr['cache_table_count']; ?></span>
<button type="submit" id="refresh" value="refresh" onclick="refreshWdkCacheCount()">Refresh Display</button>
<p>
<h4>Reset WDK Cache</h4>
<button type="submit" id="reset_cache" value="reset_cache" onclick="resetWdkCache()">Reset Cache</button>
<em>This will cause the webapp to reload as well</em>
<p>
  This is equivalent to the command,<br>
  <code>wdkCache -model <?= $model_data_tree['global']['projectId'] ?> -reset && instance_manager
    manage <?= $model_data_tree['global']['projectId'] ?> reload <?= $webapp->context_path ?> </code>

<hr>

<b>Global caching is enabled: </b><span id="wdk_is_caching"><?php
  (!$cattr['WdkIsCaching']) && print "<span class='fatal'>";
  print var_export($cattr['WdkIsCaching']);
  (!$cattr['WdkIsCaching']) && print "</span>";
  ?></span>

<?php
/**
 * only give access to the Toggle button on websites in QA stage or lower. If you
 * really must toggle a public site, use jconsole.
 */
if (getenv('WEBSITE_RELEASE_STAGE') <= getenv('WEBSITE_RELEASE_STAGE_QA')) {
  ?>
  <button type="submit" id="toggleWdkIsCaching" value="toggleWdkIsCaching" onclick="toggleWdkIsCaching()">Toggle
  </button>
<?php } ?>

<p>
  When global caching is enabled, each individual sqlQuery defined in the model will control their
  own cache behavior. When global caching is disabled, then sqlQuery caching will not be used,
  regardless of the individual setting on the query. This flag has no effect on
  processQueries, which are always cached. This option to disable caching is
  intended to aid benchmarking of database and other system tunings. Disabling global caching can cause severe
  degradation of website performance and will break some searches. Caching should never be disabled on public,
  production websites.
</p>
