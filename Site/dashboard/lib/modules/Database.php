<?php namespace lib\modules;

use Exception;
use lib\ {JolExecOperation, JolRequest};

/**
 * Superclass for database mbean access
 *
 * @author Mark Heiges <mheiges.edu>
 */
class Database extends JolModule {

  protected string $role;

  /** see org.gusdb.wdk.model.WdkModel for
   * allowed $dbName values **/
  public function __construct(string $dbName) {
    parent::__construct();
    $this->role = $dbName;
  }

  /**
   * @return boolean TRUE if operation was successful, otherwise FALSE
   * @throws Exception
   */
  public function refresh(): bool {
    $req = new JolRequest($this->jol_base_url);
    $exec = new JolExecOperation([
      'mbean'     => $this->get_mbean(),
      'operation' => 'reload',
    ]);
    $req->add_operation($exec);
    $response = $req->invoke();
    return $response[0]->is_success();
  }

  protected function get_mbean(): string {
    return 'org.gusdb.wdk:type=Database,' .
      'role=' . $this->role .
      ',data=Environment' .
      ',path=' . $this->path_name;
  }
}
