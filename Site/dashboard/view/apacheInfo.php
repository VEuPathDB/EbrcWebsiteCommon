<?php
$ai = new lib\modules\ApacheInfo();

function printTable($array): void {
  echo "<table border='0' cellspacing='3' cellpadding='2' align=''>";
  echo "<tr class='secondary3'><th><font size='-2'>Attribute</font></th><th><font size='-2'>Value</font></th></tr>";
  $i = 0;
  foreach ($array as $key => $value) {
    if ($i++ % 2 == 0) {
      $rowStyle = 'rowLight';
    } else {
      $rowStyle = 'rowMedium';
    }
    if ($key == 'Directive') {
      echo "</table><table border='0' cellspacing='3' cellpadding='2' align=''>";
    }
    echo "<tr class='$rowStyle'><td>$key</td>";
    if (is_array($value)) {
      $value = implode("</td><td>", $value);
    }
    echo "<td>$value</td></tr>  ";
  }
  echo "</table>";
}

?>
<h2>Apache HTTP Server</h2>

<p class="smalltext"><span class="expand_all clickable smalltext">expand all</span> | <span
    class="collapse_all clickable smalltext">collapse all</span></p>

<p>
<p class="clickable">HTTP Headers &#8593;&#8595;</p>
<div class="expandable" style="padding: 5px;">
  <?php printTable($ai->get('HTTP Headers Information')); ?>
</div>

<p>

<p class="clickable">Apache Environment &#8593;&#8595;</p>
<div class="expandable" style="padding: 5px;">
  <?php printTable($ai->get('Apache Environment')); ?>
</div>

<p>

<p class="clickable">Apache Internals &#8593;&#8595;</p>
<div class="expandable" style="padding: 5px;">
  <?php printTable($ai->get('apache2handler')); ?>
</div>
