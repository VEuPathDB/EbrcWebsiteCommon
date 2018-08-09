var path = require('path');
var projectHome = path.resolve(__dirname, '../..');
var wdkRoot = path.resolve(__dirname, '../../WDK/View');
var baseConfig = require(path.join(wdkRoot, 'base.webpack.config'));
var devtoolPathPrefixRe = new RegExp('^' + projectHome + '/([^/]+/){2}');

module.exports = function configure(additionalConfig) {
  return baseConfig.merge([{
    context: process.cwd(),
    output: {
      path: path.join(process.cwd(), 'dist'),
      filename: '[name].bundle.js',
      chunkFilename: 'ebrc-chunk-[name].bundle.js',
      devtoolModuleFilenameTemplate: function(info) {
        // strip prefix from absolute path
        return 'webpack:///' + info.absoluteResourcePath.replace(devtoolPathPrefixRe, './');
      }
    },
    resolve: {
      alias: {
        wdk: wdkRoot + '/webapp/wdk',
        eupathdb: __dirname + '/webapp',
        site: process.cwd() + '/webapp',
        'ebrc-client': __dirname + '/webapp/wdkCustomization/js/client'
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
      {
        'jquery'         : 'jQuery', // import $ from 'jquery' => var $ = window.jQuery
        'lodash'         : '_',
        'react'          : 'React',
        'react-dom'      : 'ReactDOM',
        'react-router'   : 'ReactRouter',
        'prop-types'     : 'ReactPropTypes',
        'flux'           : 'Flux',
        'flux/utils'     : 'FluxUtils',
        'natural-sort'   : 'NaturalSort',
        'rxjs'           : 'Rx',
        'rxjs/operators' : 'RxOperators',
      }
    ]
  }, additionalConfig]);
}

/**
 * Resolves modules IDs that begin with 'wdk-client' to properties
 * of the global `Wdk` object.
 *
 *   E.g., import { DataTable } from 'wdk-client/Components';
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
