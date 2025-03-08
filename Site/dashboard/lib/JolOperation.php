<?php

namespace lib;

/**
 * Abstract class for Jolokia operations for adding to a {@link JolRequest}.
 *
 * Example operations include read, write, exec, list, search
 *
 * Supply the full POST data payload as an array to the constructor.
 * The array should json_encode() to a valid json POST request.
 *
 * @package JMX
 * @subpackage Request
 */
abstract class JolOperation {

  protected string $type;

  protected array $http_post_array;

  /**
   * Constructor
   *
   * Supply the full POST data payload as an array to the constructor.
   * The array should json_encode() to a valid json post request.
   *
   * @param ?array $args
   */
  public function __construct(?array $args = null) {
    $this->http_post_array = [];
    $this->init($args);
  }

  /**
   * Returns the HTTP POST payload as an array.
   *
   * @return array
   */
  public function http_post_array(): array {
    return $this->http_post_array;
  }

  /**
   * Initializes the Operation object.
   *
   * Initialization minimally requires populating $http_post_array.
   */
  abstract protected function init(array $args = null): void;

  /**
   * Attempts to determine if the operation object has the required
   * POST fields for successful response.
   *
   * The validation catches common mistakes in initializing the object
   * but may miss others.
   *
   * @return boolean true if this is a valid object
   */
  abstract public function is_valid(): bool;
}
