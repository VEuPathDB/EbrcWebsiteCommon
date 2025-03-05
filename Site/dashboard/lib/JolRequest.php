<?php namespace lib;

use Exception;

/**
 * JolRequest encapsulates an HTTP POST request for a given URL and
 * collection of operations (read, exec, list, search, etc).
 *
 * @author Mark Heiges <mheiges.edu>
 * @package JMX
 * @subpackage Request
 */
class JolRequest {

  private ?string $base_url;

  /** @var array<JolOperation> */
  private array $operations;

  /**
   * @param ?string $base_url e.g. http://localhost:666/jolokia/
   */
  public function __construct(?string $base_url = null) {
    $this->operations = [];
    $this->set_base_url($base_url);
  }

  public function set_base_url(?string $base_url): void {
    $this->base_url = $base_url;
  }

  public function add_operation(JolOperation $operation) {
    if ($operation->is_valid()) {
      $this->operations[] = $operation->http_post_array();
      return;
    }

    throw new Exception("Invalid " . get_class($operation) . " object.");
  }

  public function http_postdata_as_json(): bool|string|null {
    if (count($this->operations) == 0) {
      return null;
    } elseif (count($this->operations) == 1) {
      return json_encode($this->operations[0]);
    } else {
      return json_encode($this->operations);
    }
  }

  /**
   * Returns a curl command that can be used on the command line for debugging.
   *
   * @return string curl command
   */
  public function curl_cli_equivalent(): string {
    return 'curl -d \'' . $this->http_postdata_as_json() . '\' ' . $this->base_url;
  }

  /**
   *
   * @return JolQueryResult
   */
  public function invoke(): JolQueryResult {
    $opts = [
      'url'         => $this->base_url,
      'post_fields' => $this->http_postdata_as_json(),
    ];

    return new JolQueryResult((new UserAgent($opts))->get_content());
  }
}
