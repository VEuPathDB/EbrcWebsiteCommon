<?php namespace test;

require __DIR__ . '/../autoload.php';

use Exception;
use lib\Configuration;

$c = new Configuration();

$jol_base_url = $c->get('jol_base_url');

echo "jol_base_url $jol_base_url\n";

$mem = new Memory($jol_base_url);

$res = $mem->gc();

var_dump($res);

$res = $mem->attributes();
var_dump($res);

echo "\n";

echo "making a bad request...\n";

try {
echo $mem->bad_request(). "\n";
} catch (Exception $ex) {
  echo "Caught exception (as expected):\n" . $ex->getMessage() . "\n";
}
