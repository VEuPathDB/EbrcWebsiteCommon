<?php namespace lib\modules;

use Exception;
use lib\ {Configuration, JolReadOperation, JolRequest};

/**
 * Abstract class for Jolokia models
 *
 * @author Mark Heiges <mheiges.edu>
 * @package Module
 * @subpackage Core
 */
abstract class JolModule {

  protected Configuration $configuration;
  protected ?string $jol_base_url;
  protected ?string $wdk_mbean_domain;
  protected ?string $engine_host;
  protected string $path_name;

  public ?string $context_path;

  public function __construct() {
    $c = new Configuration();
    $this->configuration = $c;
    $this->jol_base_url = $c->get('jol_base_url');
    $this->context_path = $c->get('context_path');
    $this->wdk_mbean_domain = $c->get('wdk_mbean_domain');
    $this->engine_host = $c->get('tomcat_engine_host_name');
    $this->path_name = '//' . $this->engine_host . $this->context_path;
  }

  protected abstract function get_mbean(): string;

  /**
   * @throws Exception
   */
  function attributes(): array {
    $req = new JolRequest($this->jol_base_url);
    $read = new JolReadOperation(['mbean' => $this->get_mbean()]);
    $req->add_operation($read);
    $response = $req->invoke();
    if ($response->has_error()) {
      $error1 = $response->get_errors();
      throw new Exception($error1[0]->error() . " for " . $req->curl_cli_equivalent());
    }

    /**
     * If response->has_error returns false, then we know that the type of the
     * response array values is JolQueryResultItemSuccess.
     *
     * @noinspection PhpPossiblePolymorphicInvocationInspection
     */
    return $response[0]->value();
  }
}
