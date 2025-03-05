<?php namespace lib;

use Exception;

/**
 * Parse a key=value file into an associative array.
 * Line comments marked with leading '#' or ';' are allowed. Named
 * sections as allowed in ini files are not supported here.
 */
class KeyValue {

  /** @var array<string, string> */
  var array $conf_obj = [];

  /**
   * @throws Exception if the target file cannot be opened.
   */
  function __construct(string $file) {
    if (!file_exists($file)) {
      return;
    }

    $fh = fopen($file, "r");

    if (!$fh) {
      throw new Exception("Failed to open file $file");
    }

    while (!feof($fh)) {
      $line = fgets($fh);

      if (preg_match('/^\s*#/', $line)) {
        continue;
      }
      if (preg_match('/^\s*;/', $line)) {
        continue;
      }
      if (preg_match('/^\s*$/', $line)) {
        continue;
      }
      if (!str_contains($line, '=')) {
        continue;
      }

      $kv = explode('=', $line);
      if (trim($kv[1]) == '') {
        continue;
      }
      $this->conf_obj[trim($kv[0])] = trim($kv[1]);
    }

    fclose($fh);
  }

  /**
   * Return value for given configuration key
   **/
  function get(string $key): ?string {
    if (array_key_exists($key, $this->conf_obj)) {
      return $this->conf_obj[$key];
    }
    return null;
  }
}
