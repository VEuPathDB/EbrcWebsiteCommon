<?php namespace lib;

/**
 * This class holds the application's configuration key/value pairs.
 *
 * Full application configuration is generated from several sources,
 * including the main application config.ini and an optional config.local.ini
 * which can override values from the former.
 *
 * This also includes the http port value parsed from a workers.properties
 * file (or equivalent) and the name of the Tomcat instance retrieved from
 * the Apache server environment.
 */
class Configuration {

  /** @var array<string, mixed> */
  private array $conf_ar;

  private string $global_conf_file_path;

  private string $local_conf_file_path;

  public function __construct() {
    $this->global_conf_file_path = dirname(__FILE__) . '/../config/config.ini';
    $this->local_conf_file_path = dirname(__FILE__) . '/../config/config.local.ini';

    $g_conf_ar = [];
    $l_conf_ar = [];

    if (file_exists($this->global_conf_file_path)) {
      $g_conf_ar = parse_ini_file($this->global_conf_file_path);
    }

    if ($g_conf_ar === false) {
      echo("Unable parse $this->global_conf_file_path\n\n");
      exit;
    }

    // parse optional local configuration overrides
    if (file_exists($this->local_conf_file_path)) {
      $l_conf_ar = parse_ini_file($this->local_conf_file_path);
      if ($l_conf_ar === false) {
        echo("Unable to parse $this->local_conf_file_path\n\n");
        exit;
      }
    }

    $partial_conf_ar = array_merge($g_conf_ar, $l_conf_ar);

    $this->add_http_port_value($partial_conf_ar);
    $this->add_webapp_value($partial_conf_ar);

    $partial_conf_ar['jol_base_url'] = 'http://' .
      $partial_conf_ar['jmx_bridge_host'] . ':' .
      $partial_conf_ar['http_port'] . '/' .
      $partial_conf_ar['jmx_bridge_context'] . '/';

    $this->conf_ar = $partial_conf_ar;
  }

  /**
   * Return value for given configuration key
   */
  public function get(string $key): ?string {
    if (!array_key_exists($key, $this->conf_ar)) {
      return null;
    }
    return $this->conf_ar[$key];
  }

  /**
   * Add the http port to the configuration array
   *
   * @param array $partial_conf_ar Array of configuration key/value pairs.
   */
  private function add_http_port_value(array &$partial_conf_ar): void {

    $kv = new KeyValue($partial_conf_ar['worker_properties_file']);

    /** construct the key name from template to lookup the http
     * port from workers.properties * */
    // template is custom.%TOMCAT_INSTANCE%.http_port
    $http_key_tmpl = $partial_conf_ar['worker_properties_http_var_tmpl'];

    if (array_key_exists('SERVER_NAME', $_SERVER)) {
      // worker name, e.g. TonkaDB
      $worker = $_SERVER[$partial_conf_ar['worker_env_var_name']];
    } else {
      // maybe running from command line, use value in config file
      $worker = $partial_conf_ar['tomcat_instance_for_testing'];
    }

    // key after macro substitution, key is custom.TonkaDB.http_port
    $http_port_key_name = str_replace('%TOMCAT_INSTANCE%', $worker, $http_key_tmpl);


    $partial_conf_ar['http_port'] = $kv->get($http_port_key_name);
  }

  /**
   * Add the webapp to the configuration array
   *
   * @param array $partial_conf_ar Array of configuration key/value pairs.
   *
   * @return void
   */
  private function add_webapp_value(array &$partial_conf_ar): void {
    if (array_key_exists('SERVER_NAME', $_SERVER)) {
      $context_path = $_SERVER[$partial_conf_ar['ctx_path_env_var_name']];
    } else {
      // maybe running from command line, use value in config file
      $context_path = $partial_conf_ar['tomcat_webapp_for_testing'];
    }
    $partial_conf_ar['context_path'] = $context_path;
  }
}
