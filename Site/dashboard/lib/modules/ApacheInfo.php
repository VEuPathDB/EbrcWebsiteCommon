<?php namespace lib\modules;

use function lib\parsePHPModules;
use SimpleXMLElement;

/**
 * Information about the Apache HTTP Server environment.
 */
class ApacheInfo {

  var array $data_map;

  function __construct() {
    $this->data_map = parsePHPModules();
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

  function to_xml(): bool|string {
    $xml = new SimpleXMLElement('<root/>');
    array_walk_recursive($this->data_map, [$xml, 'addChild']);
    return $xml->asXML();
  }

  function to_json(): bool|string {
    return json_encode($this->data_map);
  }
}
