var path = require('path');
var baseConfig = require('../../install/base.webpack.config');

// Create webpack alias configuration object
var alias = {
  'wdk-client': path.resolve(__dirname, 'node_modules/@veupathdb/wdk-client/lib'),
  eupathdb: __dirname + '/webapp',
  site: process.cwd() + '/webapp',
  'ebrc-client': __dirname + '/webapp/wdkCustomization/js/client',
  Client: __dirname + '/webapp/wdkCustomization/js/client'
};

module.exports = function configure(additionalConfig) {
  return baseConfig.merge([{
    context: process.cwd(),
    resolve: {
      alias,
      modules: [
        'node_modules',
        path.resolve(process.cwd(), 'node_modules'),
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'node_modules/@veupathdb/wdk-client/node_modules'),
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
