<?php namespace lib;

use DOMDocument, Exception, SimpleXMLElement;
use lib\modules\ {
  CommentConfig,
  Database,
  Jvm,
  ModelConfig,
  ProxyInfo,
  ServletInfo,
  WdkCache,
  WdkMeta,
  WdkProperties,
  Webapp,
};

/**
 * Description of PrivateAPI
 *
 * @author Mark Heiges <mheiges@uga.edu>
 */
class PrivateAPI {

  var array $api_dataset;

  /**
   * @throws Exception
   */
  public function __construct() {
    $this->init();
  }

  /**
   * @throws Exception
   */
  private function init(): void {
    $this->api_dataset = [];

    $app_database = new Database('APP');
    $adb_attr = $app_database->attributes();

    $user_database = new Database('USER');
    $udb_attr = $user_database->attributes();

    $wdk_properties = new WdkProperties();
    $wdk_properties_attr = $wdk_properties->attributes();

    $model_config = new ModelConfig();
    $model_config_attr = $model_config->attributes();

    $comment_config = new CommentConfig();
    $comment_config_attr = $comment_config->attributes();

    $wdk_meta = new WdkMeta();
    $wdk_meta_attr = $wdk_meta->attributes();

    $webapp = new Webapp();
    $webapp_attr = $webapp->attributes();

    $jvm = new Jvm();
    $jvm_attr = $jvm->attributes();

    $servletinfo = new ServletInfo();
    $servlet_data = $servletinfo->attributes();

    $cache = new WdkCache();
    $cache_attr = $cache->attributes();

    $proxy = new ProxyInfo();
    $proxy_attr = $proxy->attributes();

    $ldap_resolver = new LdapPostgresNameResolver();

    $all_data = [
      'proxy'  => [
        'proxyapp'     => $proxy_attr['proxy_app'],
        'proxyhost'    => $proxy_attr['proxy_host'],
        'upstreamhost' => $proxy_attr['upstream_server'],
      ],
      'wdk'    => [
        'displayname'   => $wdk_meta_attr['DisplayName'],       # wdkModel.getDisplayName()
        'product'       => $wdk_meta_attr['DisplayName'],       # wdkModel.getDisplayName()
        'modelname'     => $wdk_meta_attr['ProjectId'],         # wdkModel.getProjectId()
        'projectid'     => $wdk_meta_attr['ProjectId'],         # wdkModel.getProjectId()
        'modelversion'  => $wdk_meta_attr['ModelVersion'],      # wdkModel.getVersion()
        'buildnumber'   => $wdk_meta_attr['BuildNumber'],       # wdkModel.getBuildNumber()
        'databases'     => [
          'appdb'  => $this->database_node($adb_attr, $ldap_resolver),
          'userdb' => $this->database_node($udb_attr, $ldap_resolver),
        ],
        'querycache'    => [
          'enabled'    => ($cache_attr['WdkIsCaching']) ? 'true' : 'false',
          'tablecount' => $cache_attr['cache_table_count'],
        ],
        'modelconfig'   => $this->normalize_keys_in_array($model_config_attr),
        'commentconfig' => $this->normalize_keys_in_array($comment_config_attr),
        'modelprop'     => $this->normalize_keys_in_array($wdk_properties_attr),
      ],
      'tomcat' => [
        'webapp'            => $this->webapp_from_context($webapp_attr['path']),
        'webappstarttime'   => $webapp_attr['startTime'],
        'webappstarttext'   => $webapp->uptime_as_text(),
        'instance'          => $jvm_attr['SystemProperties']['instance.name'],
        'instancestarttime' => $jvm_attr['Uptime'],
        'instancestarttext' => $jvm->uptime_as_text(),
        'serverinfo'        => $servlet_data['ServerInfo'],
        'majorversion'      => $servletinfo->major_version(),
      ],
      'vmenv'  => $this->virtual_machine_environment_settings(
        $wdk_meta_attr,
        $webapp_attr,
        $adb_attr
      ),
    ];

    $this->api_dataset = array_merge($this->api_dataset, $all_data);
  }

  /**
   * Build the report node for one database.  Both the aliases and the host come
   * from a single LDAP lookup: the resolver caches per service name, so calling
   * resolve() and resolveHost() with the same name does not query twice.
   */
  private function database_node(array $attr, LdapPostgresNameResolver $ldap_resolver): array {
    $db_name = $attr['db_name'];

    return [
      'dbname'            => $db_name,
      'servername'        => $ldap_resolver->resolveHost($db_name),
      'sizeondisk'        => $attr['dbf_gb_on_disk'],
      'version'           => $attr['version'],
      'characterencoding' => $attr['character_encoding'],
      'aliases'           => $this->array_to_map($ldap_resolver->resolve($db_name), 'alias'),
    ];
  }

  /**
   * Split an one dimensional list array into a multidimensional map array using the given key.
   * input
   *       array('cryp-inc', 'crypbl2n')
   * becomes
   *       array(
   *         array( 'alias' => 'cryp-inc'),
   *         array( 'alias' => 'crypbl2n')
   *       )
   *
   * @param array $array array to split
   * @param string $key key value for each array
   *
   * @return array
   *
   * @noinspection PhpSameParameterValueInspection
   */
  private function array_to_map(array $array, string $key): array {
    $map = [];
    foreach ($array as $v) {
      $map[] = [$key => $v];
    }
    return $map;
  }

  /**
   * lowercase and remove '_' from array keys
   */
  private function normalize_keys_in_array(array $in_array): array {
    $to_array = [];
    foreach ($in_array as $k => $v) {
      if (is_array($v)) {
        $to_array[strtolower(str_replace('_', '', $k))] = $this->normalize_keys_in_array($v);
      } else {
        $to_array[strtolower(str_replace('_', '', $k))] = $v;
      }
    }
    return $to_array;
  }

  /**
   * bash shell variable assignments to aid virtual machine setup, e.g.
   *
   * PRODUCT=ClinEpiDB
   * PROJECT=ICEMR
   * WEBAPP=ce.b2
   * HOST=sa.clinenpidb.org
   * RELEASE_NUMBER=2
   * LOGIN=webwww
   * BUILD_NO=2
   **/
  private function virtual_machine_environment_settings(
    $wdk_meta_attr,
    $webapp_attr,
    $adb_attr
  ): string {

    $webapp = $this->webapp_from_context($webapp_attr['path']);

    # webapp names on VMs should be of the form toxo.b12, where '12' is the build
    # number. So strip any existing extension and add '.b12'.
    $webapp_base = preg_replace('/\..*/', '', $webapp);
    $webapp_for_vm = $webapp_base . '.b' . $wdk_meta_attr['BuildNumber'];

    // e.g. get TLD plasmodb.org from qa.plasmodb.org
    preg_match("/[^.\/]+\.[^.\/]+$/", $_SERVER['SERVER_NAME'], $matches);
    $tld = @$matches[0];

    $env = 'PRODUCT=' . $wdk_meta_attr['DisplayName'] . "\n";
    $env .= 'PROJECT=' . $wdk_meta_attr['ProjectId'] . "\n";
    $env .= 'HOST=' . 'sa.' . $tld . "\n";
    $env .= 'WEBAPP=' . $webapp_for_vm . "\n";
    $env .= 'RELEASE_NUMBER=' . $wdk_meta_attr['ModelVersion'] . "\n";
    $env .= 'APPDB_LOGIN=' . strtolower($adb_attr['login']) . "\n";
    $env .= 'BUILD_NUMBER=' . $wdk_meta_attr['BuildNumber'] . "\n";

    return $env;
  }

  // Given '/toxo.b1' return 'toxo.b1' (strip the leading slash)
  private function webapp_from_context($context): string {
    $webapp = substr($context, 1);
    return ($webapp == '') ? 'ROOT' : $webapp;
  }

  /**
   * Returns full data set as XML
   *
   * @return DOMDocument
   */
  public function get_xml(): DOMDocument {
    $xml = new DomDocument('1.0');
    $xml->preserveWhiteSpace = false;
    $xml->loadXML($this->to_xml($this->api_dataset, 'foos'));
    return $xml;
  }

  /** @noinspection PhpSameParameterValueInspection */
  private function to_xml(array $array, string $root): bool|string {
    $xml_o = new SimpleXMLElement("<?xml version=\"1.0\"?><$root></$root>");
    $this->array_to_xml($array, $xml_o);
    return $xml_o->asXML();
  }

  /**
   * Transforms array to XML
   */
  private function array_to_xml(array $array, SimpleXMLElement &$xml_o): void {
    foreach ($array as $key => $value) {
      if (is_array($value)) {
        if (!is_numeric($key)) {
          $subnode = $xml_o->addChild("$key");
          $this->array_to_xml($value, $subnode);
        } else {
          $this->array_to_xml($value, $xml_o);
        }
      } else {
        $xml_o->addChild("$key", htmlspecialchars("$value"));
      }
    }
  }

  /**
   * Returns JSON encoding of the full data set
   *
   * @return string JSON
   */
  public function to_json(): string {
    return json_encode($this->api_dataset);
  }
}
