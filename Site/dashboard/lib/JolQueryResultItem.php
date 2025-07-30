<?php namespace lib;

/**
 * A single result from a Jolokia response to a single or bulk request.
 *
 * @author Mark Heiges <mheiges.edu>
 **/
abstract class JolQueryResultItem {

  protected array $item;

  protected bool $is_error;

  public function __construct(array $item) {
    $this->item = $item;
  }

  public function is_error(): bool {
    return $this->is_error;
  }

  public function is_success(): bool {
    return !$this->is_error;
  }

  protected function set_is_error(bool $is_error): void {
    $this->is_error = $is_error;
  }

  /**
   * Returns the json request handled by Jolokia and leading to
   * this response result.
   *
   * This can differ from the original input json.
   * For example, unknown attributes are discarded and an empty
   * request is treated by Jolokia as a request for '{"type":"version"}'.
   *
   * @return string json request handled by Jolokia
   */
  public function request(): string {
    return json_encode($this->item['request']);
  }

  /**
   * @return string status code from the Jolokia JSON response object. This
   * is not the HTTP request status.
   */
  public function status(): string {
    return $this->item['status'];
  }

  /**
   * @return string String representation of the result item.
   */
  public function to_string(): string {
    return json_encode($this->item);
  }
}
