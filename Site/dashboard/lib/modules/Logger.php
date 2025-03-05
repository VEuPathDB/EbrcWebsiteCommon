<?php namespace lib\modules;

use Exception;
use lib\ {JolReadOperation, JolRequest, JolWriteOperation};

/**
 * Example template for Jolokia Module subclasses
 *
 * @author Mark Heiges <mheiges@uga.edu>
 */
class Logger extends JolModule {

  /**
   * @return array of attributes
   * @throws Exception
   */
  public function attributes(): array {
    $req = new JolRequest($this->jol_base_url);
    $read = new JolReadOperation([
      'mbean' => $this->get_mbean(),
    ]);
    $req->add_operation($read);
    $response = $req->invoke();
    if ($response->has_error()) {
      trigger_error('Error. Response was ' .
        substr($response->get_json_result(), 0, 200) .
        "...\nFor request " . $req->http_postdata_as_json());
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

  /**
   * @throws Exception
   */
  public function update($logger_map): bool {
    $req = new JolRequest($this->jol_base_url);
    $mbean = $this->get_mbean();

    foreach ($logger_map as $name => $value) {
      $op = new JolWriteOperation(array(
        'mbean' => $mbean,
        'attribute' => $name,
        'value' => $value,
      ));
      $req->add_operation($op);
    }

    $response = $req->invoke();

    if ($response->has_error()) {
      trigger_error('Error. Response was ' .
        substr($response->get_json_result(), 0, 200) .
        "...\nFor request " . $req->http_postdata_as_json());
    }

    return $response->is_success();
  }

  protected function get_mbean(): string {
    return 'org.gusdb.wdk:type=Log4J,path=' . $this->path_name;
  }
}
