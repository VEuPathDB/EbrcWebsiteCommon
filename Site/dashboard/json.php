<?php
require_once "autoload.php";

use lib\PrivateAPI;

header('Content-type: application/json');

echo (new PrivateAPI())->to_json();
