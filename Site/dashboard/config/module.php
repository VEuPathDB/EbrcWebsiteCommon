<?php
// keyworkd, module, and whether a menu tab should be made
// exclude_hosts is an optional regex matching against
// $_SERVER['SERVER_NAME']
$pageMap = [
  'Databases'                => [
    'module' => "view/databaseInfo.php",
    'tab'    => 1
  ],
  'Database Connection Pool' => [
    'module' => "view/dbConnectionPool.php",
    'tab'    => 0
  ],
  'WDK State'                => [
    'module' => "view/stateInfo.php",
    'tab'    => 1
  ],
  'Configuration'            => [
    'module' => "view/configurationInfo.php",
    'tab'    => 1
  ],
  'Tomcat'                   => [
    'module' => "view/tomcatInfo.php",
    'tab'    => 1
  ],
  'Apache'                   => [
    'module' => "view/apacheInfo.php",
    'tab'    => 1
  ],
  'Proxy'                    => [
    'module' => "view/proxyInfo.php",
    'tab'    => 1
  ],
  'Build'                    => [
    'module' => "view/buildInfo.php",
    'tab'    => 1
  ],
  'Announcements'            => [
    'module' => "/cgi-bin/admin/messageConsole.pl",
    'tab'    => 1
  ],
  'Performance'              => [
    'module' => 'view/performance.php',
    'tab'    => 1
  ],
  'Services'                 => [
    'module' => 'view/services.php',
    'tab'    => 1
  ],
  'JSLint'                   => [
    'module' => 'view/jslint.php',
    'tab'    => 0
  ],
  'Logger'                   => [
    'module' => "view/logger.php",
    'tab'    => 0
  ],
  'About'                    => [
    'module' => "view/about.php",
    'tab'    => 0
  ],
];
