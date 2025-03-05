<?php namespace lib\modules;

use Exception;
use lib\ {
  JolReadOperation,
  JolRequest,
};

/**
 * Superclass for WorkflowStatus mbean access
 */
class WorkflowStatus extends JolModule {
  /**
   * @return array WorkflowStatus attributes
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
    return 'org.apidb.wdk:type=WorkflowStatus,path=' . $this->path_name;
  }
}
