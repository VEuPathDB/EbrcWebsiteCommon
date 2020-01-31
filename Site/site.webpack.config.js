var path = require('path');
var wdkRoot = path.resolve(__dirname, '../../WDKWebsite/View');
var baseConfig = require('../../install/base.webpack.config');

var scriptRoot = path.join(__dirname, '../../WDKClient/Dependencies/lib');
var depPath = path.join.bind(null, scriptRoot);

// Shims for global style scripts
// These will expose global varables on the `window` object.
// For instance, `window.$`
// TODO Migrate to npm/yarn packages
var scripts = [
  { alias: 'lib/jquery',                                 path: depPath('jquery.js') },
  { alias: 'lib/jquery-migrate',                         path: depPath('jquery-migrate-1.2.1.js') },
  { alias: 'lib/jquery-ui',                              path: depPath('jquery-ui.js') },
  { alias: 'lib/flexigrid',                              path: depPath('flexigrid.js') },
  { alias: 'lib/jquery-blockUI',                         path: depPath('jquery.blockUI.js') },
  { alias: 'lib/jquery-cookie',                          path: depPath('jquery.cookie.js') },
  { alias: 'lib/jquery-datatables',                      path: depPath('datatables.js') },
  { alias: 'lib/jquery-datatables-natural-type-plugin',  path: depPath('datatables-natural-type-plugin.js') },
  { alias: 'lib/jquery-flot',                            path: depPath('flot/jquery.flot.js') },
  { alias: 'lib/jquery-flot-categories',                 path: depPath('flot/jquery.flot.categories.js') },
  { alias: 'lib/jquery-flot-selection',                  path: depPath('flot/jquery.flot.selection.js') },
  { alias: 'lib/jquery-flot-time',                       path: depPath('flot/jquery.flot.time.js') },
  { alias: 'lib/jquery-jstree',                          path: depPath('jstree/jquery.jstree.js') },
  { alias: 'lib/jquery-qtip',                            path: depPath('jquery.qtip.min.js') },
  { alias: 'lib/select2',                                path: depPath('select2.min.js') },
];

// Create webpack alias configuration object
var alias = scripts.reduce(function(alias, script) {
  alias[script.alias + '$'] = script.path;
  return alias;
}, {
  wdk: wdkRoot + '/webapp/wdk',
  'wdk-client': path.resolve(__dirname, '../../WDKClient/Client/src'),
  eupathdb: __dirname + '/webapp',
  site: process.cwd() + '/webapp',
  'ebrc-client': __dirname + '/webapp/wdkCustomization/js/client',
  Client: __dirname + '/webapp/wdkCustomization/js/client'
});

// Create webpack script-loader configuration object
var scriptLoaders = scripts.map(function(script) {
  return {
    test: script.path,
    loader: 'script-loader'
  };
});

module.exports = function configure(additionalConfig) {
  return baseConfig.merge([{
    context: process.cwd(),
    output: {
      path: path.join(process.cwd(), 'dist'),
      filename: '[name].bundle.js',
      chunkFilename: 'ebrc-chunk-[name].bundle.js',
      library: 'Ebrc'
    },
    module: {
      rules: [ ].concat(scriptLoaders),
    },
    resolve: {
      alias,
      modules: [
        'node_modules',
        path.resolve(process.cwd(), 'node_modules'),
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, '../../WDKClient/Client/node_modules'),
      ]
    },

    // Map external libraries Wdk exposes so we can do things like:
    //
    //    import Wdk from 'wdk;
    //    import React from 'react';
    //
    // This will give us more flexibility in changing how we load libraries
    // without having to rewrite a bunch of application code.
    externals: [
      {
        'jquery'           : 'jQuery', // import $ from 'jquery' => var $ = window.jQuery
      }
    ]
  }, additionalConfig]);
}
