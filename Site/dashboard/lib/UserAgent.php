<?php namespace lib;

class UserAgent {
  var string $url;
  var false|\CurlHandle $ua;

  /**
   * Options:
   * * url
   * * post_fields
   **/
  function __construct(mixed $opts = null) {
    $this->ua = curl_init();
    if (is_array($opts)) {
      $this->set_url($opts['url']);
      if (array_key_exists('post_fields', $opts) && isset($opts['post_fields'])) {
        $this->set_post_fields($opts['post_fields']);
      }
    }
  }

  function setContentType(string $contentType): UserAgent {
    curl_setopt($this->ua, CURLOPT_HTTPHEADER, ["Content-Type: $contentType"]);
    return $this;
  }

  function get_content(): bool|string {
    $this->set_return_transfer(true);
    return curl_exec($this->ua);
  }

  function set_url(string $url): void {
    $this->url = $url;
    curl_setopt($this->ua, CURLOPT_URL, $url);
  }

  function set_post_fields(string|array $post_fields): void {
    $this->set_use_post(true);
    curl_setopt($this->ua, CURLOPT_POSTFIELDS, $post_fields);
  }

  function set_use_post(bool $bool): void {
    curl_setopt($this->ua, CURLOPT_POST, $bool);
  }

  function set_return_transfer(bool $bool): void {
    curl_setopt($this->ua, CURLOPT_RETURNTRANSFER, $bool);
  }

  function close(): void {
    curl_close($this->ua);
  }
}
