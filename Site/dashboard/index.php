<?php
require_once 'autoload.php';

$pageMap = require_once 'config/module.php';

use lib\modules\ProxyInfo;
use lib\UserAgent;

/* Check if the page/tab has an 'exclude_hosts_re' regex matching
 * current host */
function exclude_this(array $pageMap, string $key): bool {
  if (array_key_exists('exclude_hosts_re', $pageMap[$key])) {
    $exclude_hosts_re = $pageMap[$key]['exclude_hosts_re'];
    return (preg_match("/$exclude_hosts_re/", $_SERVER['SERVER_NAME']));
  }

  return false;
}
?>
<!doctype html>
<html lang="en">

<?php include 'head.php.inc'; ?>

<body>
<h3 class='banner'>
  <?php

  echo "<a href='/'>";
  echo $_SERVER['SERVER_NAME'];

  $pi = new ProxyInfo();
  $pi_attr = $pi->attributes();

  if ($upstreamServer = $pi_attr['upstream_server']) {
    echo "<br><span class='banner-sub'>(upstream server: " . $upstreamServer . ")</span>";
  }

  echo "</a>";
  echo "<br><span class='banner-sub'>[canonical server: " . php_uname('n') . "]</span>";

  $headers = apache_request_headers();
  ?>
</h3>
<?php
// default page
$page = $_GET['p'] ?? 'Databases';
?>
<ul id="tabmenu">
  <?php
  // Print tabs menu
  foreach ($pageMap as $key => $value) {
    if (exclude_this($pageMap, $key))
      continue;

    if (!$value['tab'])
      continue;

    if ($key == 'Proxy' && !isset($headers['Via']))
      continue;
    $active = ($key == $page) ? "class='active'" : '';
    echo "<li><a $active href='?p=$key'>$key</a></li>\n";
  }
  ?>
</ul>
<div id="content">
  <?php
  if (!$pageMap[$page]) {
    echo "unknown page '$page'";
    return;
  }

  if (exclude_this($pageMap, $page)) {
    echo "NA";
  } else {
    $module = $pageMap[$page]['module'];
    if (str_starts_with($module, "/")) {
      $module = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $module;
    }

    if (str_starts_with($module, 'http')) {
      $req = new UserAgent(['url' => $module]);
      $req->forward_cookies(['auth_tkt']);
      echo $req->get_content();
    } elseif (str_ends_with($module, ".php"))  {
      include $module;
    } else {
      readfile($module);
    }
  }
  ?>
  <a href="?p=About"><img class="dashboard-logo" src="images/logo.png" alt="About this dashboard"/></a>
</div>
</body>
</html>
