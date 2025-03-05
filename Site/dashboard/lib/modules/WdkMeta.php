<?php namespace lib\modules;

use Exception;
use lib\ {JolReadOperation, JolRequest};

/**
 * WDK meta information from mbean
 * org.gusdb.wdk:type=Meta
 *
 * @author Mark Heiges <mheiges@uga.edu>
 */
class WdkMeta extends JolModule {

  /**
   * @return array of attributes
   * @throws Exception
   */
  public function attributes(): array {
    $req = new JolRequest($this->jol_base_url);
    $read = new JolReadOperation(['mbean' => $this->get_mbean()]);
    $req->add_operation($read);
    $response = $req->invoke();
    if ($response->has_error()) {
      trigger_error(
        'Error. Response was ' .
        substr($response->get_json_result(), 0, 200) .
        "...\nFor request " . $req->http_postdata_as_json()
      );
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
    return $this->wdk_mbean_domain . ':type=Meta,path=' . $this->path_name;
  }
}
