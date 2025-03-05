<?php namespace lib\modules;

use Exception;
use lib\ {JolExecOperation, JolReadOperation, JolRequest};

/**
 * WDK Cache stats and operations.
 * org.gusdb.wdk:type=Cache
 *
 * @author Mark Heiges <mheiges@uga.edu>
 */
class WdkCache extends JolModule {
  /**
   * @return array Application Database attributes
   * @throws Exception
   */
  public function attributes(): array {
    $req = new JolRequest($this->jol_base_url);
    $read = new JolReadOperation(['mbean' => $this->get_mbean()]);
    $req->add_operation($read);
    $response = $req->invoke();
    // FIXME: This call could cause problems if the response was an error.  The
    //        error result type does not have a value() method.
    return $response[0]->value();
  }

  /**
   * @return boolean TRUE if operation was successful, otherwise FALSE
   * @throws Exception
   */
  public function reset(): bool {
    $req = new JolRequest($this->jol_base_url);
    $exec = new JolExecOperation([
      'mbean'     => $this->get_mbean(),
      'operation' => 'resetWdkCache',
    ]);
    $req->add_operation($exec);
    $response = $req->invoke();
    return $response[0]->is_success();
  }

  /**
   * @throws Exception
   */
  public function toggleWdkIsCaching() {
    $req = new JolRequest($this->jol_base_url);
    $exec = new JolExecOperation([
      'mbean'     => $this->get_mbean(),
      'operation' => 'toggleWdkIsCaching',
    ]);
    $req->add_operation($exec);
    $response = $req->invoke();
    return $response[0]->is_success();
  }

  protected function get_mbean(): string {
    return $this->wdk_mbean_domain . ':type=Cache,path=' . $this->path_name;
  }
}
