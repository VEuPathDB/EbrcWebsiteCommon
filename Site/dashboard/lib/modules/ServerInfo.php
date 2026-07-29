<?php namespace lib\modules;

use function lib\parsePHPModules;
use SimpleXMLElement;

/**
 * Information about the HTTP Server environment.
 */
class ServerInfo {
  const TYPE_APACHE = 'apache';
  const TYPE_NGINX = 'nginx';

  private string $serverType;


  function __construct() {

    if (array_key_exists('SERVER_SOFTWARE', $_SERVER)) {
      $software = strtolower($_SERVER['SERVER_SOFTWARE']);

      switch (true) {
        case str_contains($software, self::TYPE_NGINX):
          $this->serverType = self::TYPE_NGINX;
          break;
        case str_contains($software, self::TYPE_APACHE):
          $this->serverType = self::TYPE_APACHE;
          break;
        default:
          $slash = strpos($software, "/");
          $this->serverType = $slash === false
            ? $software
            : substr($software, $slash);
      }
    } else {
      $this->serverType = "unknown";
    }
  }

  function getServerType(): string {
    return $this->serverType;
  }

  function get_data_map(): array {
    return $this->data_map;
  }

}
