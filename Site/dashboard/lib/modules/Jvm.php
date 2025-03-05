<?php namespace lib\modules;

use Exception;
use lib\ {
  JolReadOperation,
  JolRequest,
  function seconds_as_periods,
  function date_on_elapsed_seconds,
};

/**
 * Java JVM operations from mbean
 * java.lang:type=Runtime
 *
 * @author Mark Heiges <mheiges@uga.edu>
 */
class Jvm extends JolModule {

  private string $uptime_as_text;

  public function __construct() {
    parent::__construct();
  }

  /**
   * @return array JVM attributes
   * @throws Exception
   */
  public function attributes(): array {
    $req = new JolRequest($this->jol_base_url);
    $read = new JolReadOperation([
      'mbean'     => $this->get_mbean(),
      'attribute' => ['Uptime']
    ]);
    $req->add_operation($read);
    $response = $req->invoke();
    // FIXME: This call could cause problems if the response was an error.  The
    //        error result type does not have a value() method.
    $attrs = $response[0]->value();
    $this->set_uptime_as_text($attrs['Uptime']);
    return $attrs;
  }

  public function uptime_as_text(): string {
    return $this->uptime_as_text;
  }

  protected function get_mbean(): string {
    return 'java.lang:type=Runtime';
  }

  private function set_uptime_as_text($uptime): void {
    $seconds_up = $uptime / 1000;
    $string = seconds_as_periods($seconds_up);
    $string .= ' (since ' . date_on_elapsed_seconds($seconds_up) . ')';
    $this->uptime_as_text = $string;
  }
}
