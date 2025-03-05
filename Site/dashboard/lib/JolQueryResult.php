<?php namespace lib;

use ArrayAccess, ArrayIterator, IteratorAggregate;

class JolQueryResult implements IteratorAggregate, ArrayAccess {

  private string $json_result;

  private bool $has_error = false;

  /** @var array<JolQueryResultItem> */
  private array $result_array = [];

  /** @var array<JolQueryResultItemError> */
  private array $error_array = [];

  public function __construct(string $json_result) {
    if (empty($json_result)) {
      error_log('json_result is empty. ' . ' at ' . __CLASS__ . ' line ' . __LINE__);
      //throw new Exception("json result is empty");
      return;
    }
    $this->set_json_result($json_result);
  }

  public function set_json_result(string $json_result): void {
    $this->json_result = $json_result;
    $ar_result = json_decode($this->json_result, true);

    if (empty($ar_result)) {
      trigger_error('unable to decode empty json result' . ' at ' . __CLASS__ . ' line ' . __LINE__);
      return;
    }
    // normalize single entity responses into an array
    // so they are consistent with bulk query responses
    if (array_key_exists('status', $ar_result)) {
      $ar_result = [$ar_result];
    }

    foreach ($ar_result as $result) {
      if (isset($result) && $result['status'] == '200') {
        $this->result_array[] = new JolQueryResultItemSuccess($result);
      } else {
        $error = new JolQueryResultItemError($result);
        $this->result_array[] = $error;
        $this->has_error = true;
        $this->error_array[] = $error;
      }
    }
  }

  public function has_error(): bool {
    return $this->has_error;
  }

  public function is_success(): bool {
    return !$this->has_error;
  }

  public function get_errors(): array {
    return $this->error_array;
  }

  public function get_json_result(): string {
    return $this->json_result;
  }

  public function get_result_array(): array {
    return $this->result_array;
  }

  public function getIterator(): ArrayIterator {
    return new ArrayIterator($this->result_array);
  }

  public function offsetSet($offset, $value): void {
    if (is_null($offset)) {
      $this->result_array[] = $value;
    } else {
      $this->result_array[$offset] = $value;
    }
  }

  public function offsetExists($offset): bool {
    return isset($this->result_array[$offset]);
  }

  public function offsetUnset($offset): void {
    unset($this->result_array[$offset]);
  }

  public function offsetGet($offset): ?JolQueryResultItem {
    return $this->result_array[$offset] ?? null;
  }
}
