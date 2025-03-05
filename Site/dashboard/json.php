<?php
require_once "autoload.php";

use lib\PrivateAPI;

header('Content-type: application/json');

print (new PrivateAPI())->to_json();
