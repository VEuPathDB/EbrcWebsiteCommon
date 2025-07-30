<?php
/**
 * Information about HTTP reverse proxy (if any).
 */
$attributes = (new lib\modules\ProxyInfo())->attributes();

$nginx_proxy_switcher_base = str_replace('@HOST@', $attributes['proxied_host'], $attributes['nginx_proxy_switcher']);

$nginxForm = $nginx_proxy_switcher_base
  . "&return=" . $_SERVER['SCRIPT_URI'] . '?' . $_SERVER["QUERY_STRING"];

$proxyNotice = '';
if ($attributes['via']) {
  $proxyNotice = "<p>This site is reverse-proxied via <i>'{$attributes['via']}'</i> to upstream host {$attributes['upstreamServer']}.";
}
?>
<h2>Reverse-Proxy Server</h2>
<?= $proxyNotice ?>
<p>
  <a href="<?= $nginxForm ?>">Change upstream server</a> (separate authentication required)
</p>
