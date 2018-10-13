var path = require('path');
var wdkRoot = path.resolve(__dirname, '../../WDKWebsite/View');
var baseConfig = require('../../WDKClient/Build/base.webpack.config');

module.exports = function configure(additionalConfig) {
  return baseConfig.merge([{
    context: process.cwd(),
    output: {
      path: path.join(process.cwd(), 'dist'),
      filename: '[name].bundle.js',
      chunkFilename: 'ebrc-chunk-[name].bundle.js',
    },
    resolve: {
      alias: {
        wdk: wdkRoot + '/webapp/wdk',
        eupathdb: __dirname + '/webapp',
        site: process.cwd() + '/webapp',
        'ebrc-client': __dirname + '/webapp/wdkCustomization/js/client'
      }
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
        'jquery'           : 'jQuery', // import $ from 'jquery' => var $ = window.jQuery
        'history'          : 'HistoryJS',
        'lodash'           : '_',
        'lodash/fp'        : '_fp',
        'natural-sort'     : 'NaturalSort',
        'prop-types'       : 'ReactPropTypes',
        'react'            : 'React',
        'react-dom'        : 'ReactDOM',
        'react-redux'      : 'ReactRedux',
        'react-router'     : 'ReactRouter',
        'redux'            : 'Redux',
        'redux-observable' : 'ReduxObservable',
        'reselect'       : 'Reselect',
        'rxjs'             : 'Rx',
        'rxjs/operators'   : 'RxOperators',
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
