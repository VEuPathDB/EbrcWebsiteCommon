<?php namespace lib\modules;

use Exception;
use lib\ {JolReadOperation, JolRequest};

/**
 * WDK model-config.xml as instantiated in WDK. From mbean
 * org.gusdb.wdk:type=ModelConfig
 *
 * @author Mark Heiges <mheiges@uga.edu>
 */
class ModelConfig extends JolModule {

  public function __construct() {
    parent::__construct();
  }

  /**
   * @return array ModelConfig attributes
   * @throws Exception
   */
  public function attributes(): array {
    $req = new JolRequest($this->jol_base_url);
    $read = new JolReadOperation(['mbean' => $this->get_mbean()]);
    $req->add_operation($read);
    $response = $req->invoke();
    // FIXME: This call could cause problems if the response was an error.  The
    //        error result type does not have a value() method.
    return $this->re_section_data($response[0]->value());
  }

  protected function get_mbean(): string {
    return $this->wdk_mbean_domain . ':type=ModelConfig,path=' . $this->path_name;
  }

  /**
   * JMX data for model-config is flat with section names encoded as a prefix.
   *
   * In situ configuration looks like
   * <modelConfig smtpServer=localhost email=a@b.com ...
   * <appDb maxWait=50 ...
   * <userDb connectionUrl=jdbc:oracle:oci:@apicommN ..
   *
   * JMX represents as
   * [appDb] maxWait = 50
   * [userDb] connectionUrl = jdbc:oracle:oci:@apicommN
   * [global] smtpServer = localhost
   * [global] email = a@b.com
   *
   * This function reshapes this back into a sectional hierarchy
   * global => [
   *   smtpServer => localhost,
   *   email => a@b.com
   * ]
   *
   * @param array $raw_data
   *
   * @return array
   */
  private function re_section_data(array $raw_data): array {
    $data_tree = [];

    foreach ($raw_data as $k => $v) {
      # regex delimiter: starts with [, capture all characters not a ], followed by ] and a space
      $node = preg_split("/^\[([^]]+)] /", $k, null, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);

      if (count($node) > 1) {
        $section = $node[0];
        (array_key_exists($section, $data_tree)) || $data_tree[$section] = [];
        $data_tree[$section][$node[1]] = $v;
      } else {
        $data_tree[] = [$node[0] => $v];
      }
    }

    return $data_tree;
  }
}
