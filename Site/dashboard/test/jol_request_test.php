<?php
/**
 * @noinspection PhpPossiblePolymorphicInvocationInspection
 * @noinspection PhpUnhandledExceptionInspection
 */
namespace test;

require __DIR__ . '/../autoload.php';

use Exception;
use lib\ {
  Configuration,
  JolExecOperation,
  JolReadOperation,
  JolRequest,
};


$c = new Configuration();

$jol_base_url = $c->get('jol_base_url');

echo "========= empty read request ========== \n";

$req = new JolRequest();
$req->set_base_url($jol_base_url);

$read = new JolReadOperation();
try {
  $req->add_operation($read);
  $req->invoke();
} catch (Exception) {
  echo "OK - Correctly caught exception for invalid operation object.\n";
}

echo "======================================= \n";

echo "======== single read request (attribute + path) ======== \n";

$req = new JolRequest();
$req->set_base_url($jol_base_url);

$read = new JolReadOperation([
  'mbean'     => 'java.lang:type=Memory',
  'attribute' => 'HeapMemoryUsage',
  'path'      => 'max',
]);
$req->add_operation($read);
$response = $req->invoke();
$data = $response[0]->value();
echo "max mem: " . $data . "\n";
echo "======================================= \n";

echo "======== single read request (attribute) ======== \n";

$req = new JolRequest();
$req->set_base_url($jol_base_url);

$read = new JolReadOperation([
  'mbean'     => 'java.lang:type=Memory',
  'attribute' => 'HeapMemoryUsage',
]);
$req->add_operation($read);
$response = $req->invoke();
$data = $response[0]->value();
echo "max mem: " . $data['max'] . "\n";
echo "======================================= \n";

echo "======== single read request (whole mbean) ======== \n";

$req = new JolRequest();
$req->set_base_url($jol_base_url);

$read = new JolReadOperation([
  'mbean' => 'java.lang:type=Memory',
]);
$req->add_operation($read);
$response = $req->invoke();
$data = $response[0]->value();
echo "max mem: " . $data['HeapMemoryUsage']['max'] . "\n";
echo "======================================= \n";

echo "======== single read request (path without attribute) ======== \n";

$req = new JolRequest();
$req->set_base_url($jol_base_url);

$read = new JolReadOperation([
  'mbean' => 'java.lang:type=Memory',
  'path'  => 'max',
]);
try {
  $req->add_operation($read);
  $response = $req->invoke();
  $data = $response[0]->value();
  echo "max mem: " . $data['HeapMemoryUsage']['max'] . "\n";
} catch (Exception) {
  echo "OK - Correctly caught invalid object exception\n";
}
echo "======================================= \n";

attributes();

function attributes(): void {
  global $jol_base_url;
  $req = new JolRequest();
  $req->set_base_url($jol_base_url);
  $read = new JolReadOperation([
    'mbean' => 'org.apidb.wdk:path=//localhost/toxo.mheiges,type=Database,role=AppDB',
  ]);
  $exec = new JolExecOperation([
    'mbean'     => 'org.apidb.wdk:type=Database,role=AppDB,path=//localhost/toxo.mheiges',
    'operation' => 'refresh',
    'arguments' => null,
  ]);
  $read_error = new JolReadOperation([
    'mbean'     => 'org.apidb.wdk:path=//localhost/toxo.mheiges,type=Database,role=AppDB',
    'attribute' => 'BOGUSATTR',
  ]);
  $read_again = new JolReadOperation([
    'mbean'     => 'org.apidb.wdk:path=//localhost/toxo.mheiges,type=Database,role=AppDB',
    'attribute' => 'system_date',
  ]);
  $req->add_operation($read);
  $req->add_operation($exec);
  $req->add_operation($read_error);
  $req->add_operation($read_again);

  echo "ori json request: " . $req->http_postdata_as_json() . "\n";

  $response = $req->invoke();
  //return value_array = $result->value();
  //echo "json result " . $response->get_json_result() . "\n";
  $data = $response[0]->value();

  echo "System Date 0: " . $data['system_date'] . "\n";
  if (!$response[2]->is_error())
    echo "System Date 2: " . $response[2]->value() . "\n";
  echo "System Date 2: " . $response[3]->value() . "\n";

  foreach ($response as $result) {
    if ($result->is_error()) {
      echo "ERROR " . $result->error_type() . "\n";
      continue;
    }
    $map = $result->value();
    echo "map " . $map . "\n";
    echo "request " . $result->request() . "\n";
    echo "timestamp " . $result->timestamp() . "\n";
  }
}
