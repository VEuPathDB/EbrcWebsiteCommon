<?php namespace lib\modules;

/**
 * @author Mark Heiges <mheiges.edu>
 */
class ConnectionPool extends JolModule {

  protected string $role;

  public function __construct(string $dbName) {
    parent::__construct();
    $this->role = $dbName;
  }

  protected function get_mbean(): string {
    return 'org.gusdb.wdk:type=Database,role=' .
      $this->role . ',data=ConnectionPool' .
      ',path=' . $this->path_name;
  }
}
