<?php namespace lib\xml;

use DOMDocument, DOMElement, DOMException, DOMNode;

/**
 * @throws DOMException
 */
function error_node(DOMDocument $dom_doc, string $error_str): bool|DOMElement {
  return $dom_doc->createElement('error', $error_str);
}


/** traverse node tree, print values **/
function print_node_values(DOMNode $node): void {
  if ($node->hasChildNodes()) {
    foreach ($node->childNodes as $child) {
      print_node_values($child);
    }
  } else {
    echo trim($node->nodeValue) . "\n";
  }
}


/**
 * merge
 * <dom_doc>           <source>
 * <node1/>     +       <node2/>
 * </dom_doc>          </source>
 * into
 * <dom_doc>
 * <node1/>
 * <node2/>
 * </dom_doc>
 **/
function merge_child_nodes_with_doc(DOMDocument $dom_doc, DOMDocument $source): void {
  foreach ($source->documentElement->childNodes as $node) {
    $importNode = $dom_doc->importNode($node, true);
    $dom_doc->documentElement->appendChild($importNode);
  }
}
