<?php
/**
 * @noinspection PhpUnhandledExceptionInspection
 */

namespace test;

use lib\ {JolExecOperation, JolReadOperation, JolRequest};

/**
 * Access to JVM memory stats
 * java.lang:type=Memory
 *
 * @author Mark Heiges <mheiges.edu>
 */
class Memory {

  private string $base_url;

  public function __construct($base_url) {
    $this->base_url = $base_url;
  }

  public function attributes(): array {
    $req = new JolRequest($this->base_url);
    $read = new JolReadOperation([
      'mbean'     => 'java.lang:type=Memory',
      'attribute' => 'HeapMemoryUsage',
    ]);
    $req->add_operation($read);
    echo "\n" . $req->curl_cli_equivalent() . "\n\n";

    $response = $req->invoke();
    return $response[0]->value();
  }

  public function bad_request() {
    $req = new JolRequest($this->base_url);
    $read = new JolReadOperation([
      'mbean'     => 'java.lang:type=Memory',
      'attribute' => 'BOGUS',
    ]);
    $req->add_operation($read);

    $response = $req->invoke();
    if ($response->has_error()) {
      $error1 = $response->get_errors();
      throw new Exception($error1[0]->error());
    }
    return $response[0]->value();
  }

  public function gc(): bool {
    $req = new JolRequest($this->base_url);
    $exec = new JolExecOperation([
      'mbean'     => 'java.lang:type=Memory',
      'operation' => 'gc',
    ]);
    $req->add_operation($exec);
    $response = $req->invoke();
    return !$response[0]->is_error();
  }
}
