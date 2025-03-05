<?php namespace lib;

class LdapTnsNameResolver {

  private ?string $service_name;

  private string $dn;

  /** @var string[] */
  private array $attrs;

  private string $ldap_url;

  public function __construct(?string $service_name = null) {
    $this->service_name = $service_name;
    $this->dn = "cn=OracleContext,ou=applications,dc=apidb,dc=org";
    $this->attrs = ["cn"];
    $this->ldap_url = "ds1.apidb.org ds4.apidb.org";
  }

  /**
   * Returns an array of aliases from LDAP for given service_name
   */
  public function resolve(?string $service_name = null): array {
    $aliases = [];

    if ($service_name != null) {
      $this->service_name = $service_name;
    }

    $filter = "(orclNetDescString=*" . $this->service_name . "*)";

    $conn = ldap_connect($this->ldap_url);
    ldap_set_option($conn, LDAP_OPT_NETWORK_TIMEOUT, 1);
    $r = @ldap_bind($conn);
    if (!$r) {
      error_log("unable to bind to directory server");
      return $aliases;
    }

    $sr = ldap_search($conn, $this->dn, $filter, $this->attrs);

    $entries = ldap_get_entries($conn, $sr);

    ldap_close($conn);

    for ($i = 0; $i < $entries["count"]; $i++) {
      $aliases[] = $entries[$i]["cn"][0];
    }

    return $aliases;
  }
}
