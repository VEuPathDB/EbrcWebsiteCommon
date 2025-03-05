<?php namespace lib\modules;

use Exception;
use lib\ {
  JolExecOperation,
  JolRequest,
};

/**
 * @author Mark Heiges <mheiges.edu>
 */
class OpenConnections extends JolModule {
  protected function get_mbean(): string {
    return 'org.gusdb.wdk:type=Database,status=OpenConnections' .
      ',path=' . $this->path_name;
  }

  /**
   * @return boolean TRUE if operation was successful, otherwise FALSE
   * @throws Exception
   */
  public function dumpDbConnectionStatsToLog(string $dbclass): bool {
    $req = new JolRequest($this->jol_base_url);
    $exec = new JolExecOperation([
      'mbean'     => $this->get_mbean(),
      'operation' => "dumpOpen${dbclass}Connections",
    ]);
    $req->add_operation($exec);
    $response = $req->invoke();
    return $response[0]->is_success();
  }
}
