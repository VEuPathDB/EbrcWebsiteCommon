<?php

function rglob(string $path): void {
  foreach (glob($path . "/*") as $subpath) {
    if (is_dir($subpath)) {
      rglob($subpath);
    } elseif (basename($subpath) == "functions.php") {
      require_once $subpath;
    }
  }
}

rglob(__DIR__ . "/lib");

spl_autoload_extensions(".php");
spl_autoload_register();
