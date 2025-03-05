<?php namespace lib;

/**
 * A single Jolokia EXEC operation for adding to a {@link JolRequest}.
 *
 * Supply the full POST data payload as an array to the constructor.
 * The array should json_encode() to a valid json POST request.
 *
 * Multivalued arguments should be passed in as an array() such that
 * the json produced by json_encode($array) is a valid input to Jolokia.
 *
 * For example, use
 * <pre>
 *   new JolExecOperation(array(
 *       'mbean' => 'java.util.logging:type=Logging',
 *       'operation' => 'setLoggerLevel',
 *       'arguments' => array('global', 'INFO'),
 *       ));
 * </pre>
 * to produce the Jolokia json input
 * <pre>
 *   {"type":"exec",
 *    "mbean":"java.util.logging:type=Logging",
 *    "operation":"setLoggerLevel",
 *    "arguments":["global","INFO"]}
 * </pre>
 *
 * After instantiating the Operation object, add it to a {@link JolRequest}
 * <pre>
 * $op = new JolExecOperation($array);
 * $req = new {@link JolRequest};
 * $req->add_operation($op);
 * </pre>
 */
class JolExecOperation extends JolOperation {
  /**
   * Initializes the Operation object.
   *
   * Initialization minimally requires populating $http_post_array.
   */
  protected function init(?array $args = null): void {
    $this->http_post_array['type'] = 'exec';

    if (!isset($args))
      return;

    $this->http_post_array['mbean'] = array_key_exists('mbean', $args)
      ? $args['mbean']
      : null;
    $this->http_post_array['operation'] = array_key_exists('operation', $args)
      ? $args['operation']
      : null;
    $this->http_post_array['arguments'] = array_key_exists('arguments', $args)
      ? $args['arguments']
      : null;
  }

  /**
   * Test if the operation object has the required POST fields.
   *
   * The validation catches common mistakes in initializing the object
   * but may miss others.
   *
   * @return boolean true if this is a valid object
   */
  public function is_valid(): bool {
    $a = $this->http_post_array();
    if (!isset($a['mbean']) || !isset($a['operation'])) {
      return false;
    }
    return true;
  }
}
