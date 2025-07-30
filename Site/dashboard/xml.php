<?php
require_once "autoload.php";

use lib\PrivateAPI;
use lib\xml\ {
  function error_node,
  function merge_child_nodes_with_doc,
  function print_node_values,
};

// version of data and format returned. Change value e.g as
// elements are added, removed.
const FORMATVERSION = '1.0';
const ROOTNAME = 'dashboard';

$api = new PrivateAPI();

$want_value = false;

$path_info = trim(@$_SERVER["PATH_INFO"], '/');
/**
 * Check if pathinfo terminates with 'value' and remove it. The remainder of path_info
 * will be used for an xpath query.
 * /dashboard/xml/wdk returns xml document
 * /dashboard/xml/wdk/value returns text values of /dashboard/xml/wdk
 * */
if ($path_info) {
  if ($path_info == 'version') {
    print FORMATVERSION;
    exit;
  }
  if (basename($path_info) == 'value') {
    $want_value = true;
    $path_info = dirname($path_info);
  }
}

$req_xpath = ($path_info) ? '/' . $path_info : ROOTNAME;

$all_xml = $api->get_xml();

/** Construct new XML doc and combine xml gathered from various sources * */
$sitexml = new DOMDocument('1.0');
$sitexml->formatOutput = true;

$root = $sitexml->createElement(ROOTNAME);
$root->setAttribute('version', FORMATVERSION);
$sitexml->appendChild($root);

merge_child_nodes_with_doc($sitexml, $all_xml);

/** get node from xpath query * */
$domxpath = new DOMXpath($sitexml);
$qstr = "/$req_xpath";

$reportxml = new DomDocument('1.0');
$qnode = $domxpath->query($qstr)->item(0);

if ($qnode == null) {
  $qnode = error_node($sitexml, "no match for '$qstr'");
}

$reportxml->appendChild($reportxml->importNode($qnode, true));
$reportxml->preserveWhiteSpace = false;
$reportxml->formatOutput = true;

/** text values or XML output * */
if ($want_value) {
  header('Content-type: text/plain');
  print_node_values($qnode);
} else {
  header('Content-type: text/xml');
  print $reportxml->saveXml();
}
