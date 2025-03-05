<?php namespace lib\modules;

use Exception;
use lib\{JolQueryResultItemSuccess, JolReadOperation, JolRequest};

/**
 * comment-config.xml as instantiated in WDK. From mbean
 * org.gusdb.wdk:type=CommentConfig
 *
 * @author Mark Heiges <mheiges@uga.edu>
 */
class CommentConfig extends JolModule {
  /**
   * @return array CommentConfig attributes
   * @throws Exception
   */
  public function attributes(): array {
    $req = new JolRequest($this->jol_base_url);
    $read = new JolReadOperation(['mbean' => $this->get_mbean()]);
    $req->add_operation($read);
    $response = $req->invoke();
    if ($response->has_error()) {
      return [];
    }

    /**
     * If response->has_error returns false, then we know that the type of the
     * response array values is JolQueryResultItemSuccess.
     *
     * @noinspection PhpPossiblePolymorphicInvocationInspection
     */
    return $response[0]->value();
  }

  protected function get_mbean(): string {
    return 'org.apidb.wdk:type=CommentConfig,path=' . $this->path_name;
  }
}
