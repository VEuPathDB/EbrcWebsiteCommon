<?php namespace lib\modules;

use Exception;
use lib\ {JolReadOperation, JolRequest};

/**
 * Selected attributes from org.apidb.wdk:type=ServletVersions mbean
 *
 * @author Mark Heiges <mheiges@uga.edu>
 */
class ServletInfo extends JolModule {

  private string $major_version;

  /**
   * @return array servlet attributes
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
    $attrs = $response[0]->value();

    $this->set_major_version($attrs['ServerInfo']);
    $attrs['MajorVersion'] = $this->major_version();

    return $attrs;
  }

  public function major_version(): string {
    return $this->major_version;
  }

  protected function get_mbean(): string {
    return 'org.apidb.wdk:type=ServletVersions' . ',path=' . $this->path_name;
  }

  /**
   * Set Tomcat major version given Tomcat serverinfo string.
   * "Apache Tomcat/6.0.43" returns "6"
   */
  private function set_major_version(string $serverinfo): void {
    preg_match(';.+/(\d)\..+;', $serverinfo, $m);
    $this->major_version = $m[1];
  }
}
