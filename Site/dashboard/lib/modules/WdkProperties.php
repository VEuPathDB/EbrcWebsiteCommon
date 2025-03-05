<?php namespace lib\modules;

use Exception;
use lib\ { JolReadOperation, JolRequest };

/**
 * WDK model.prop and other properties as instantiated in WDK. From mbean
 * org.gusdb.wdk:type=Properties
 *
 * @author Mark Heiges <mheiges@uga.edu>
 */
class WdkProperties extends JolModule {

  /**
   * @return array WDK properties
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

  protected function get_mbean(): string {
    return $this->wdk_mbean_domain . ':type=Properties,path=' . $this->path_name;
  }
}
