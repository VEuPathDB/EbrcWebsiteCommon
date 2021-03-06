/dashboard is a web interface that provides state information for a EuPathDB website,
including data from Apache HTTP Server, Tomcat and the WDK.

/dashboard is written in PHP. The Tomcat and WDK information is obtained from JMX mbeans
via Jolokia's JMX-HTTP bridge. Apache server information is obtained directly from
PHP's libraries.


Requirements for /dashboard

  - Jolokia JMX-HTTP bridge deployed in the same Tomcat instance as the webapp hosting /dashboard.

  - Apache HTTP server configuration must export environment variables
  for `TOMCAT_INSTANCE` and `CONTEXT_PATH` [1]. e.g.

    ```
    SetEnv TOMCAT_INSTANCE Test
    SetEnv CONTEXT_PATH /cryptodb.msh
    ```

  - http ports configured in workers.properties file [2]. e.g.

    ```
    custom.TonkaDB.http_port=8500
    ```

  - Add directives for /dashboard In Apache virtual host configuration [3]. e.g.

    ```
    Alias /dashboard /var/www/mheiges.cryptodb.org/dashboard
    <Directory "/var/www/mheiges.cryptodb.org/dashboard">
      AllowOverride AuthConfig FileInfo Indexes Limit Options=All,MultiViews
      Options +MultiViews
    </Directory>
    ```

  - PHP 5
    - PECL json PHP module (available in the RPM php-pecl-json)

  - Oracle database permissions
    - These are technically required by the JMX MBean, `org.gusdb.wdk.jmx.mbeans.dbms`.
    - `dbf_gb_on_disk` attribute requires `select from dba_data_files, dba_temp_files`
    - `server_name` attribute requires `UTL_INADDR` ACL, to run the query,
      - `select UTL_INADDR.get_host_name as server_name, UTL_INADDR.get_host_address as server_ip from dual;`


Development

A php module (`dashboard/lib/modules`) is a class that fetches data from
some source (e.g. a JMX bridge or Apache environment) and coalesces the
data into a format that can be consumed by a View (dashboard/view). The
module implements to_xml() and to_json() methods.




Footnotes

[1]. /dashboard will use these to look up localhost port for Jolokia.
The names of these variables are defined in /dashboard's php.config.

```
worker_env_var_name=TOMCAT_INSTANCE
ctx_path_env_var_name=CONTEXT_PATH
```

Specifically, /dashboard uses Apache's `TOMCAT_INSTANCE` environment
variable to look up the http port in the `workers.properties` file. For
example, if the instance is TonkaDB, /dashboard looks for
`custom.TonkaDB.http_port` in the `workers.properties` file.

/dashboard uses the `CONTEXT_PATH` environment variable as the context
/value in the object name in its JMX request.

  ```
  org.apidb:component=WDK,subcom=Databases,module=UserDB,path=//localhost/cryptodb.msh
  ```

[2].  This is a custom configuration for /dashboard. The property name
is defined in /dashboard's `php.config` using the
`worker_properties_http_var_tmpl` property.

[3]. The /dashboard web interface is outside the normal html directory
so requires explicit configuration to install and grant access to it.
This is an intentional design requirement so it doesn't accidentally
expose site internals.

The MultiViews option in the Apache vitual host configuration allows
urls like `/dashboard/xml` to work without the .php extension.
