<?php

use lib\modules\ServerInfo;

$server = new ServerInfo();

$header = "HTTP Server";

switch ($server->getServerType()) {
  case ServerInfo::TYPE_APACHE:
    $header = "Apache " . $header;
    break;
  case ServerInfo::TYPE_NGINX:
    $header = "NGINX " . $header;
    break;
}


function printTable(array $array, ?string $prefix = null): void {
  echo "<table border='0' cellspacing='3' cellpadding='2' align=''>";
  echo "<tr class='secondary3'><th><font size='-2'>Attribute</font></th><th><font size='-2'>Value</font></th></tr>";

  $i = 0;
  $pLen = empty($prefix) ? 0 : strlen($prefix);

  foreach ($array as $key => $value) {
    if ($pLen > 0) {
      if (!str_starts_with($key, $prefix))
        continue;

      $key = substr($key, $pLen);
    }

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
<h2><?=$header?></h2>

<p class="smalltext">
  <span class="expand_all clickable smalltext">expand all</span>
  | <span class="collapse_all clickable smalltext">collapse all</span>
</p>

<p class="clickable">HTTP Headers &#8593;&#8595;</p>
<div class="expandable" style="padding: 5px;">
  <?php printTable($_SERVER, 'HTTP_'); ?>
</div>

<?php if ($server->getServerType() == ServerInfo::TYPE_APACHE): ?>
<p class="clickable">Apache Environment &#8593;&#8595;</p>
<div class="expandable" style="padding: 5px;">
  <?php printTable($server->get('Apache Environment')); ?>
</div>

<p class="clickable">Apache Internals &#8593;&#8595;</p>
<div class="expandable" style="padding: 5px;">
  <?php printTable($server->get('apache2handler')); ?>
</div>
<?php endif;