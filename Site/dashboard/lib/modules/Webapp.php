<?php namespace lib\modules;

use Exception;
use lib\ {
  JolExecOperation,
  JolReadOperation,
  JolRequest,
  function seconds_as_periods,
  function date_on_elapsed_seconds,
};

/**
 * Access to mulitple Tomcat mbeans, including selected attributes
 * and a webapp reload operation.
 *
 * @author Mark Heiges <mheiges@uga.edu>
 */
class Webapp extends JolModule {

  private string $uptime_as_text;
  private string $domain;

  public function __construct() {
    parent::__construct();
    $this->domain = $this->configuration->get('tomcat_engine_name'); // Catalina
    $this->context_path = $this->configuration->get('context_path');
  }

  /**
   * @return array of attributes
   *
   * @throws Exception if Jolokia request fails.
   * @noinspection PhpPossiblePolymorphicInvocationInspection
   */
  public function attributes(): array {
    $loaders = [
      // Tomcat 6.x
      new JolReadOperation([
        'mbean'     => $this->domain .
          ':type=Loader,path=' . $this->context_path .
          ',host=' . $this->engine_host,
        'attribute' => ['loaderRepositoriesString'], // use array so we get array response
      ]),
      // Tomcat 8.x
      new JolReadOperation([
        'mbean'     => $this->domain .
          ':type=Loader,context=' . $this->context_path .
          ',host=' . $this->engine_host,
        'attribute' => ['loaderRepositoriesString'], // use array so we get array response
      ]),
    ];

    $app = new JolReadOperation([
      'mbean'     => "$this->domain:" .
        'j2eeType=WebModule,name=//' .
        $this->engine_host . $this->context_path .
        ',J2EEApplication=none,J2EEServer=none',
      'attribute' => ['startTime', 'path'],
    ]);

    // list of all the other webapp paths deployed in the instance
    $all_deployed_webmodules = new JolReadOperation([
      'mbean'     => "$this->domain:" . 'j2eeType=WebModule,*',
      'attribute' => ['path'],
    ]);

    foreach ($loaders as $loader) {
      $req = new JolRequest($this->jol_base_url);
      $req->add_operation($loader);
      $req->add_operation($app);
      $req->add_operation($all_deployed_webmodules);

      $response = $req->invoke();
      if (!$response->has_error()) {
        break;
      }
    }

    if ($response->has_error()) {
      throw new Exception('invalid response: ' . $response->get_json_result());
    }

    $attributes = array_merge_recursive($response[0]->value(), $response[1]->value());

    $attributes['loaderRepositoriesString'] = str_replace(
      'file:',
      '',
      $attributes['loaderRepositoriesString']
    );

    $attributes['other_deployed_webapps'] = [];
    $all_webmodules = array_merge_recursive($response[2]->value());
    foreach ($all_webmodules as $module) {
      if ($attributes['path'] == $module['path']) {
        continue;
      }
      $webapp = preg_replace('/^\//', '', $module['path']);
      $attributes['other_deployed_webapps'][] = ($webapp ?: 'ROOT');
    }

    $this->set_uptime_as_text($attributes['startTime']);

    return $attributes;
  }

  /**
   * Reloads the webapp and refreshes the attributes collection.
   *
   * @return boolean TRUE if operation was successful, otherwise FALSE
   *
   * @throws Exception if Jolokia request fails.
   */
  public function reload(): bool {
    $req = new JolRequest($this->jol_base_url);
    $exec = new JolExecOperation([
      'mbean'     => "$this->domain:" .
        'j2eeType=WebModule,name=//' .
        $this->engine_host . $this->context_path .
        ',J2EEApplication=none,J2EEServer=none',
      'operation' => 'reload',
    ]);
    $req->add_operation($exec);
    $response = $req->invoke();
    if ($response->has_error()) {
      return false;
    }

    // refresh attributes
    $this->attributes();

    return $response[0]->is_success();
  }

  public function uptime_as_text(): string {
    return $this->uptime_as_text;
  }

  protected function get_mbean(): string {
    return '';
  }

  private function set_uptime_as_text(int $starttime): void {
    if ($starttime == 0) {
      return;
    }
    $seconds_elapsed = max(0, (time() - ($starttime / 1000)));
    $string = seconds_as_periods($seconds_elapsed);
    $string .= ' (since ' . date_on_elapsed_seconds($seconds_elapsed) . ')';
    $this->uptime_as_text = $string;
  }
}
