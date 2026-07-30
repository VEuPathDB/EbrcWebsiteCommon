<?php
/**
 * Information about the project build.
 */

use lib\modules\ {BuildInfo, StageValues};

$build_info = new BuildInfo();
$build = $build_info->get_data_map();


$stage_values = new StageValues();
$flipped_stages = $stage_values->get_flipped_data_map();
$stages = $stage_values->get_data_map();
?>
<h2>Website Stage</h2>
<?php
$stage_value = getenv('WEBSITE_RELEASE_STAGE');

if ($stage_value) {
  echo '<p>';
  echo "<b>Website Release Stage:</b> " . $flipped_stages[$stage_value] . ' (' . $stage_value . ')';
  echo '</p>';

  if (isset($_COOKIE["website_release_stage"])) {
    echo "<p class='warn'>The default stage for this site is overridden for this browser session by the cookie '<b>website_release_stage</b>' and may differ 
    from the actual stage. Delete this cookie or restart your browser to revert to the default.</p>";
  }

  /**
   * // only development sites can change their stage on the fly
   * if ($stage_value == $stages['DEVELOPMENT'] || isset($_COOKIE["website_release_stage"])) {
   * echo "<p><a href='set_website_release_stage_70'>change</a></p>";
   * }
   */
} else {
  echo "The 'WEBSITE_RELEASE_STAGE' environment variable is not set.";
}
?>
<h2>Build State</h2>
<p>
  Last build was for '<b><?= $build_info->get('!Last.build.component') ?></b>
  <b><?= $build_info->get('!Last.build.initialTarget') ?></b>'
  on <b><?= $build_info->get('!Last.build.timestamp') ?></b>
  <a href='javascript:void()' style="text-decoration:none"
     onmouseover="return overlib('A given build may not refresh all project components. ' +
         'For example, a \'ApiCommonData/Model install\' does not build any WDK code.<br>' +
         'See Build Details for a cumulative record of past builds.')"
     onmouseout="return nd();"><sup>[?]</sup></a>

<p>

<p><i>
    Working directories are recorded at build time. An incomplete build will result in an incomplete list.
    Any repos  in project_home that are not defined as dependencies in the GUS/Ant build will
    not be listed.
</i></p>

<p class="clickable">Component Build Details &#8593;&#8595;</p>

<div class="expandable">
  <p class="smalltext">A given build may not refresh all project components. The following is a cummulative record of past builds.</p>

  <table>
    <tr class="secondary3">
      <th>Component</th>
      <th>Build Time</th>
    </tr>
    <?php
    /**
     * example prop: ApiCommonModel.Model.buildtime
     * 1. sort
     * 2. list only *.buildtime props
     * 3. remove '.buildtime'
     * 4. sub '.' with '/'
     * */
    $i = 0;
    ksort($build);
    foreach ($build as $p => $v) {
      if ($trunc = strpos($p, '.buildtime')) {
        $p = str_replace('.', '/', substr($p, 0, $trunc));
        if ($i % 2) {
          echo '<tr class="rowMedium">';
        } else {
          echo '<tr class="rowLight">';
        }
        echo "<td><pre>$p</pre></td>";
        echo "<td><pre>$v</pre></td>";
        echo "</tr>\n";
        $i++;
      }
    }
    ?>
  </table>

</div>
