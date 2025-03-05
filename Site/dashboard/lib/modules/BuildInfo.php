<?php namespace lib\modules;

use Exception;
use function lib\parse_properties;

/**
 * Build state information.
 *
 * The GUS build system writes build state information, including Subversion
 * info and timestamps, to a properties file in $GUS_HOME. This module
 * encapsulates that data.
 *
 * @author Mark Heiges <mheiges.edu>
 */
class BuildInfo {

  private array $data_map;

  function __construct() {
    try {
      $this->data_map = parse_properties($_SERVER['GUS_HOME'] . '/.buildlog/gus-build-state.log');
    } catch (Exception $e) {
      echo 'Exception: ', $e->getMessage(), "\n";
      return;
    }
  }

  /**
   * Return value for given key
   */
  function get($key) {
    if (array_key_exists($key, $this->data_map)) {
      return $this->data_map[$key];
    }
    return null;
  }

  function get_data_map(): array {
    return $this->data_map;
  }
}
