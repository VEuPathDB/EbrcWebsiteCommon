<?php namespace lib;

use DOMDocument, Exception, SimpleXMLElement;
use lib\modules\ {
  BuildInfo,
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

    $build = new BuildInfo();
    $proxy = new ProxyInfo();
    $proxy_attr = $proxy->attributes();

    $ldap_resolver = new LdapTnsNameResolver();

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
          'appdb'  => [
            'servicename'  => $adb_attr['service_name'],
            'instancename' => $adb_attr['instance_name'],
            'globalname'   => $adb_attr['global_name'],
            'dbuniquename' => $adb_attr['db_unique_name'],
            'servername'   => $adb_attr['server_name'],
            'sizeondisk'   => $adb_attr['dbf_gb_on_disk'],
            'aliases'      => $this->array_to_map($ldap_resolver->resolve($adb_attr['service_name']), 'alias'),
          ],
          'userdb' => [
            'servicename'  => $udb_attr['service_name'],
            'instancename' => $udb_attr['instance_name'],
            'globalname'   => $udb_attr['global_name'],
            'servername'   => $udb_attr['server_name'],
            'sizeondisk'   => $udb_attr['dbf_gb_on_disk'],
            'aliases'      => $this->array_to_map($ldap_resolver->resolve($udb_attr['service_name']), 'alias'),
          ],
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
      'svn'    => $this->init_svn_info($build->get_data_map()),
      'vmenv'  => $this->virtual_machine_environment_settings(
        $wdk_meta_attr,
        $webapp_attr,
        $adb_attr
      ),
    ];

    $this->api_dataset = array_merge($this->api_dataset, $all_data);
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
   * Restructures and formats subversion data that was extracted
   * from the GUS .build.info properties file via the BuildInfo class.
   */
  private function init_svn_info(array $build): array {
    $array = [
      'locations' => [],
      'switch'    => '',
      'checkout'  => '',
    ];

    $switch_stmts = null;
    $checkout_stmts = null;

    foreach ($build as $prop => $data) {
      if (strpos($prop, '.svn.info')) {
        $info = $this->svninfo_from_build_data($prop, $data);
        if ($info === null) {
          // return empty array so any piping to a shell is a noop
          return $array;
        } else {
          $svnbranch = $info['URL'];
          $svnproject = $info['Working Directory'];
          $svnrevision = $info['Revision'];
          $array['locations'][] = [
            'location' => [
              'remote'   => $svnbranch,
              'local'    => $svnproject,
              'revision' => $svnrevision
            ]
          ];

          $switch_stmts .= "svn switch -r$svnrevision $svnbranch $svnproject;\n";
          $checkout_stmts .= "svn checkout -r$svnrevision $svnbranch $svnproject;\n";
        }
      }
    }
    $array['switch'] = $switch_stmts;
    $array['checkout'] = $checkout_stmts;
    return $array;
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

  static function svninfo_from_build_data($prop, $data): ?array {
    $info = [];

    if ($end_of_proj_name = strpos($prop, '.svn.info')) {
      # $prop matches '.svn.info'. $data, e.g. is:
      #    Path: ApiCommonModel
      #    Working Copy Root Path: /var/www/AmoebaDB/amoeba.integrate/project_home/ApiCommonModel
      #    URL: https://cbilsvn.pmacs.upenn.edu/svn/apidb/ApiCommonModel/trunk
      #    Relative URL: ^/ApiCommonModel/trunk
      #    Repository Root: https://cbilsvn.pmacs.upenn.edu/svn/apidb
      #    Repository UUID: 735e2a04-f8fc-0310-8a1b-f2942603c481
      #    Revision: 67558
      #    Node Kind: directory
      #    Schedule: normal
      #    Last Changed Author: crouchk
      #    Last Changed Rev: 67525
      #    Last Changed Date: 2015-04-24 11:33:36 -0400 (Fri, 24 Apr 2015)
      #
      # Split that on newlines...
      $infoset = explode("\n", $data);
      foreach ($infoset as $attr) {
        if (strlen($attr) == 0) {
          continue;
        }
        # $attr is of the form
        #     Path: ApiCommonModel
        # and
        #     URL: https://cbilsvn.pmacs.upenn.edu/svn/apidb/ApiCommonModel/trunk
        # etc.
        # Split each of those by ':' (with a array lenght limit of '2'
        # so we don't split on the colons in the url or timestamps).
        $pairs = explode(':', $attr, 2);
        # That should create a two element array. Combine those
        if (count($pairs) == 2) {
          $info[$pairs[0]] = trim($pairs[1]);
        } else {
          return null;
        }
      }
      # Extract the working directory name from the $prop . e.g.
      # strip off '.svn.info'.
      #   EbrcWebsiteCommon.svn.info
      # becomes
      #   EbrcWebsiteCommon
      $info['Working Directory'] = str_replace('.', '/', substr($prop, 0, $end_of_proj_name));
      return $info;
    }

    return null;
  }
}
