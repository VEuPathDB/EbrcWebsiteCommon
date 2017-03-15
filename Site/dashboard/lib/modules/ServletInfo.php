<?php
require_once dirname(__FILE__) . "/JolModule.php";

/**
 * Selected attributes from org.apidb.wdk:type=ServletVersions mbean
 *
 * @author Mark Heiges <mheiges@uga.edu>
 * @package Module
 * @subpackage Tomcat
*/
class ServletInfo extends JolModule {

  private $major_version;

  /**
   * @return array servlet attributes
   */
  public function attributes() {
    //$domain = $this->configuration->get('tomcat_engine_name');
    $req = new JolRequest($this->jol_base_url);
    $read = new JolReadOperation(array(
                'mbean' => 'org.apidb.wdk:type=ServletVersions' . ',path=' . $this->path_name,
            ));
    $req->add_operation($read);
    $response = $req->invoke();
    if ($response->has_error()) {
      trigger_error('Error. Response was ' .
              substr($response->get_json_result(), 0, 200) .
        "...\nFor request " . $req->http_postdata_as_json());
      return null;
    }
    $attrs = $response[0]->value();
    $this->set_major_version($attrs{'ServerInfo'});
    $attrs{'MajorVersion'} = $this->set_major_version($attrs{'ServerInfo'});
    return $attrs;
  }

  /**
   * Set Tomcat major version given Tomcat serverinfo string.
   * "Apache Tomcat/6.0.43" returns "6"
   */
  private function set_major_version($serverinfo) {
    preg_match(';.+/(\d)\..+;', $serverinfo, $m);
    $this->major_version = $m[1];
  }

  public function major_version() {
    return $this->major_version;
  }

}

?>
