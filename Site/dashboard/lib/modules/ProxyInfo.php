<?php namespace lib\modules;

use lib\ {
  Configuration,
  function upstreamServer,
};

class ProxyInfo {
  /**
   * @var array<string, string|null>
   */
  var array $data_map;

  function __construct() {
    $this->data_map = $this->init();
  }

  private function init(): array {
    $c = new Configuration();

    $headers = apache_request_headers();

    if (!isset($headers['Via'])) {
      // this is not a proxied site
      return [
        'via'                  => null,
        'proxy_app'            => null,
        'proxy_host'           => null,
        'proxied_host'         => null,
        'upstream_server'      => null,
        'nginx_proxy_switcher' => null,
      ];
    }

    // if apache proxies to a relative URL, the request goes back through
    // the proxy resulting in appended header, e.g.
    // nginx at 128.192.75.110, nginx at 128.192.75.110
    // So, split and take the first.
    [$via] = explode(',', $headers['Via']);

    [$proxy_app, $prox_host] = explode(' at ', $via);

    return [
      'via'                  => $headers['Via'],
      'proxy_app'            => $proxy_app,
      'proxy_host'           => $prox_host,
      'proxied_host'         => $headers['Host'],
      'upstream_server'      => upstreamServer(),
      'nginx_proxy_switcher' => $c->get('nginx_proxy_switcher'),
    ];
  }

  function attributes(): array {
    return $this->data_map;
  }
}
