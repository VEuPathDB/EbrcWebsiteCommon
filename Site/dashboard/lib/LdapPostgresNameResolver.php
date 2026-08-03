<?php namespace lib;

use function \ldap_bind;
use function \ldap_close;
use function \ldap_connect;
use function \ldap_get_entries;
use function \ldap_search;
use function \ldap_set_option;

class LdapPostgresNameResolver {

  private ?string $service_name;

  private string $dn;

  /** @var string[] */
  private array $attrs;

  private string $ldap_url;

  /** @var string[] aliases found by the most recent search */
  private array $aliases = [];

  /** host the most recent search resolved to, if any */
  private ?string $host = null;

  /** service_name the cached results above belong to; false when never searched */
  private string|false|null $searched_service_name = false;

  public function __construct(?string $service_name = null) {
    $this->service_name = $service_name;
    $this->dn = "cn=PostgresContext,ou=applications,dc=apidb,dc=org";
    $this->attrs = ["cn", "pgConnectionParam"];
    $this->ldap_url = "ds.apidb.org"; // "ds4.apidb.org"
  }

  /**
   * Returns an array of aliases from LDAP for given service_name
   */
  public function resolve(?string $service_name = null): array {
    $this->search($service_name);
    return $this->aliases;
  }

  /**
   * Returns the database host from LDAP for given service_name, or null when
   * the record cannot be found.  The host is one of the record's
   * pgConnectionParam values, e.g. "host=ares13.penn.apidb.org".
   */
  public function resolveHost(?string $service_name = null): ?string {
    $this->search($service_name);
    return $this->host;
  }

  /**
   * Looks up the record for given service_name, caching what it finds so that
   * resolve() and resolveHost() share a single query.
   */
  private function search(?string $service_name): void {
    if ($service_name != null) {
      $this->service_name = $service_name;
    }

    if ($this->searched_service_name === $this->service_name) {
      return;
    }

    $this->searched_service_name = $this->service_name;
    $this->aliases = [];
    $this->host = null;

    $filter = "(pgConnectionParam=*" . $this->service_name . "*)";

    $conn = ldap_connect($this->ldap_url);
    ldap_set_option($conn, LDAP_OPT_NETWORK_TIMEOUT, 1);
    $r = @ldap_bind($conn);
    if (!$r) {
      error_log("unable to bind to directory server");
      return;
    }

    $sr = ldap_search($conn, $this->dn, $filter, $this->attrs);

    $entries = ldap_get_entries($conn, $sr);

    ldap_close($conn);

    // ldap_get_entries() lowercases attribute names, hence 'pgconnectionparam'
    for ($i = 0; $i < $entries["count"]; $i++) {
      $this->aliases[] = $entries[$i]["cn"][0];

      if ($this->host === null) {
        $this->host = $this->connectionParam($entries[$i]["pgconnectionparam"] ?? [], "host");
      }
    }
  }

  /**
   * Picks a single "<name>=<value>" pgConnectionParam out of an LDAP attribute
   * value list and returns its value.
   */
  private function connectionParam(array $params, string $name): ?string {
    $prefix = "$name=";

    for ($i = 0; $i < ($params["count"] ?? 0); $i++) {
      if (str_starts_with($params[$i], $prefix)) {
        return substr($params[$i], strlen($prefix));
      }
    }

    return null;
  }
}
