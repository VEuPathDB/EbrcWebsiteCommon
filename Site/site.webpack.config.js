var path = require('path');
var fs = require('fs');

var wdkRoot = path.resolve(__dirname, '../../WDK/View');
var pkgPath = path.join(process.cwd(), 'package.json');
var pkgAliases = fs.existsSync(pkgPath) ? require(pkgPath).browser : undefined;

var baseConfig = require(path.join(wdkRoot, 'base.webpack.config'));

module.exports = function configure(additionalConfig) {
  return baseConfig.merge({
    context: process.cwd(),
    resolve: {
      alias: {
        wdk: wdkRoot + '/webapp/wdk',
        eupathdb: __dirname + '/webapp',
        site: process.cwd() + '/webapp'
      }
    },
    resolveLoader: {
      modules: [ 'node_modules', path.join(wdkRoot, 'node_modules') ]
    },

    // Map external libraries Wdk exposes so we can do things like:
    //
    //    import Wdk from 'wdk;
    //    import React from 'react';
    //
    // This will give us more flexibility in changing how we load libraries
    // without having to rewrite a bunch of application code.
    externals: [
      resolveWdkClientExternal,
      Object.assign({
        'jquery'       : 'jQuery',
        'lodash'       : '_',
        'react'        : 'React',
        'react-dom'    : 'ReactDOM',
        'react-router' : 'ReactRouter'
      }, pkgAliases)
    ]
  }, additionalConfig);
}

/**
 * Resolves modules IDs that begin with 'wdk-client' to properties
 * of the global `Wdk` object.
 *
 * See https://webpack.github.io/docs/configuration.html#externals (function bullet)
 */
function resolveWdkClientExternal(context, request, callback) {
  var matches = /^wdk-client(\/(.*))?/.exec(request);
  if (matches != null) {
    if (matches[2]) {
      return callback(null, 'var Wdk.' + matches[2]);
    }
    else {
      return callback(null, 'var Wdk');
    }
  }
  callback();
}
