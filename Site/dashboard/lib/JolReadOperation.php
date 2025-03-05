<?php namespace lib;

/**
 * A single Jolokia READ operation for adding to a {@link JolRequest}.
 *
 * Supply the full POST data payload as an array to the constructor.
 * The array should json_encode() to a valid json POST request.
 *
 * For example, use
 * <pre>
 *   new JolReadOperation(array(
 *       'mbean' => 'java.lang:type=Memory',
 *       'attribute' => 'HeapMemoryUsage',
 *       'path' => 'max',
 *       ));
 * </pre>
 * to produce the HTTP POST json for Jolokia
 * <pre>
 *      {"type":"read",
 *       "mbean":"java.lang:type=Memory",
 *       "attribute":"HeapMemoryUsage",
 *       "path":"max"
 *      }
 * </pre>
 *
 * The mbean property must be set.
 * Attribute can be a string or array containing a list attributes to read.
 * If no attribute is given, then all attributes are read. The path allows
 * accessing a single value of a complex value. See Jolokia documentation for
 * more information.
 *
 * After instantiating the Operation object, add it to a {@link JolRequest}
 * <pre>
 * $op = new JolReadOperation($array);
 * $req = new {@link JolRequest};
 * $req->add_operation($op);
 * </pre>
 *
 * @package JMX
 * @subpackage Request
 */
class JolReadOperation extends JolOperation {
  /**
   * Initializes the Operation object.
   *
   * Initialization minimally requires populating $http_post_array.
   */
  protected function init(?array $args = null): void {
    $this->http_post_array['type'] = 'read';

    if (!isset($args))
      return;

    $this->http_post_array['mbean'] = array_key_exists('mbean', $args)
      ? $args['mbean']
      : null;
    $this->http_post_array['attribute'] = array_key_exists('attribute', $args)
      ? $args['attribute']
      : null;
    $this->http_post_array['path'] = array_key_exists('path', $args)
      ? $args['path']
      : null;
  }

  /**
   * Attempts to determine if the operation object has the required
   * POST fields for successful response.
   *
   * The validation catches common mistakes in initializing the object
   * but may miss others.
   *
   * @return boolean true if this is a valid object
   */
  public function is_valid(): bool {
    $a = $this->http_post_array();

    if (!isset($a['mbean'])) {
      return false;
    }

    if (isset($a['path']) && !isset($a['attribute'])) {
      return false;
    }

    return true;
  }

  public function __toString(): string {
    $a = $this->http_post_array();
    $string = '{"type":"read","mbean":"' . $a['mbean'] . '","attribute":"' . join(',', $a['attribute']) . '"';
    if (isset($a['path'])) {
      $string .= ',"path":"' . $a['path'] . '"';
    }
    $string .= '}';
    return $string;
  }
}
