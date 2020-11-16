var baseConfig = require('../../install/base.webpack.config');

// Create webpack alias configuration object
var alias = {
  site: process.cwd() + '/webapp',
};

module.exports = function configure(additionalConfig) {
  return baseConfig.merge([{
    context: process.cwd(),
    resolve: {
      alias,
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
