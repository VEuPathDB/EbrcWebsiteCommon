<?php namespace lib;

class JolQueryResultItemError extends JolQueryResultItem {

  public function __construct($item) {
    parent::__construct($item);
    $this->set_is_error(true);
  }

  public function error_type() {
    return $this->item['error_type'];
  }

  public function error() {
    return $this->item['error'];
  }

  public function stacktrace() {
    return $this->item['stacktrace'];
  }
}
