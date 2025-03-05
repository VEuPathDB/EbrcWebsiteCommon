<?php namespace lib;

date_default_timezone_set('America/New_York');

/**
 * Misc functions
 */
function upstreamServer(): ?string {
  $headers = apache_request_headers();

  if (isset($headers['Via'])) {
    $host_port = getModuleSetting('apache2handler', 'Hostname:Port');
    $uphost = substr($host_port, 0, strrpos($host_port, ':'));
    return "$uphost";
  }

  return null;
}

// http://us.php.net/phpinfo
function getModuleSetting(string $pModuleName, string $pSetting): string {
  $vModules = parsePHPModules();
  return $vModules[$pModuleName][$pSetting];
}

// http://us.php.net/phpinfo
function parsePHPModules(): array {
  ob_start();
  phpinfo(INFO_MODULES);
  $s = ob_get_contents();
  ob_end_clean();

  $s = strip_tags($s, '<h2><th><td>');
  $s = preg_replace('/<th[^>]*>([^<]+)<\/th>/', "<info>\\1</info>", $s);
  $s = preg_replace('/<td[^>]*>([^<]+)<\/td>/', "<info>\\1</info>", $s);
  $vTmp = preg_split('/(<h2>[^<]+<\/h2>)/', $s, -1, PREG_SPLIT_DELIM_CAPTURE);
  $vModules = [];
  for ($i = 1; $i < count($vTmp); $i++) {
    if (preg_match('/<h2>([^<]+)<\/h2>/', $vTmp[$i], $vMat)) {
      $vName = trim($vMat[1]);
      $vTmp2 = explode("\n", $vTmp[$i + 1]);
      foreach ($vTmp2 as $vOne) {
        $vPat = '<info>([^<]+)<\/info>';
        $vPat3 = "/$vPat\s*$vPat\s*$vPat/";
        $vPat2 = "/$vPat\s*$vPat/";
        if (preg_match($vPat3, $vOne, $vMat)) {
          $vModules[$vName][trim($vMat[1])] = [trim($vMat[2]), trim($vMat[3])];
        } elseif (preg_match($vPat2, $vOne, $vMat)) {
          $vModules[$vName][trim($vMat[1])] = trim($vMat[2]);
        }
      }
    }
  }
  return $vModules;
}

// hattip to http://blog.rafaelsanches.com/2009/08/05/reading-java-style-properties-file-in-php/
function parse_properties($property_file): array {
  $property_text = file_get_contents($property_file);
  if (!$property_text) {
    trigger_error("unable to read $property_file");
    return [];
  }
  $result = [];
  $lines = preg_split("\n", $property_text);
  $key = "";
  $isWaitingOtherLine = false;
  $value = "";

  foreach ($lines as $i => $line) {
    if (empty($line) || (!$isWaitingOtherLine && str_starts_with($line, "#")))
      continue;
    if (!$isWaitingOtherLine) {
      $key = unescape_property(substr($line, 0, strpos($line, '=')));
      $value = unescape_property(substr($line, strpos($line, '=') + 1, strlen($line)));
    } else {
      $value .= unescape_property($line);
    }

    /* Check if ends with single '\' */
    if (strrpos($value, "\\") === strlen($value) - strlen("\\")) {
      $value = substr($value, 0, strlen($value) - 1) . "\n";
      $isWaitingOtherLine = true;
    } else {
      $isWaitingOtherLine = false;
    }

    $result[$key] = $value;
    unset($lines[$i]);
  }

  return $result;
}

function unescape_property(array|string $value): array|string {
  return str_replace(["\\#", "\\!", "\\=", "\\:", "\\t", "\\n", "\\r"], ["#", "!", "=", ":", "\t", "\n", "\r"], $value);
}

/**
 * Return date string for (current time - given milliseconds)
 * e.g. Wed 07 Dec 2011 11:44 AM
 * */
function date_on_elapsed_seconds($seconds): string {
  $now = time();
  return date("D d M Y g:i A", $now - $seconds);
}

/**
 * return seconds elapsed as string, showing only the greatest non-zero period
 * and the next smaller period.
 * e.g. 3 days 4 minutes
 * or   4 minutes 3 seconds
 * */
function seconds_as_periods($seconds): string {

  $times = [];
  $gp = 0; // greatest non-zero time period found

  $days = floor($seconds / 60 / 60 / 24);
  if ($days != 0) {
    $times[] = $days . 'd';
    $gp = 1;
  }

  $hours = ($seconds / 60 / 60) % 24;
  if ($hours != 0 || $gp == 1) {
    $times[] = $hours . 'h';
    $gp = 1;
  }

  $minutes = ($seconds / 60) % 60;
  if ($minutes != 0 || $gp == 1) {
    $times[] = $minutes . 'm';
    $gp = 1;
  }

  $seconds = ($seconds) % 60;
  if ($seconds != 0 || $gp == 1) {
    $times[] = $seconds . 's';
  }

  $string = isset($times[0]) ? "$times[0]" : '0s';
  $string .= isset($times[1]) ? " $times[1]" : '';

  return $string;
}
