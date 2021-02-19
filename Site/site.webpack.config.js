var path = require('path');
var baseConfig = require('../../install/base.webpack.config');

// Create webpack alias configuration object
var devAlias = {
  site: process.cwd() + '/webapp',
  '@veupathdb/wdk-client': path.resolve(__dirname, '../../WDKClient/Client'),
  '@veupathdb/web-common': path.resolve(__dirname, '../../EbrcWebsiteCommon/Client'),
};
var prodAlias = {
  site: process.cwd() + '/webapp',
};

module.exports = function configure(additionalConfig) {
  return baseConfig.merge((env, argv) => [{
    context: process.cwd(),
    resolve: {
      alias: argv.mode === 'production' ? prodAlias : devAlias,
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
