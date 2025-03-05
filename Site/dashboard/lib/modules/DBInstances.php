<?php namespace lib\modules;

use lib\ {JolReadOperation, JolRequest};

/**
 * Superclass for DBInstances mbean access
 *
 * @author Mark Heiges <mheiges.edu>
 */
class DBInstances extends JolModule {
  protected function get_mbean(): string {
    return 'org.gusdb.wdk:type=Database,status=DBInstances' .
      ',path=' . $this->path_name;
  }
}
