import * as path from 'path';
import { merge, webpack } from '../../WDK/View/base.webpack.config';

// var path = require('path');
var wdkRoot = path.resolve(__dirname, '../../WDK/View');

export default function configure(additionalConfig: webpack.Configuration) {
  return merge({
    context: process.cwd(),
    output: {
      path: path.join(process.cwd(), 'dist'),
      filename: '[name].bundle.js',
      chunkFilename: 'ebrc-chunk-[name].bundle.js'
    },
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
      {
        'jquery'       : 'jQuery',
        'lodash'       : '_',
        'react'        : 'React',
        'react-dom'    : 'ReactDOM',
        'react-router' : 'ReactRouter',
        'prop-types'   : 'ReactPropTypes',
        'flux'         : 'Flux',
        'flux/utils'   : 'FluxUtils'
      }
    ]
  }, additionalConfig);
}

/**
 * Resolves modules IDs that begin with 'wdk-client' to properties
 * of the global `Wdk` object.
 *
 * See https://webpack.github.io/docs/configuration.html#externals (function bullet)
 */
const resolveWdkClientExternal: webpack.ExternalsFunctionElement = function resolveWdkClientExternal(context, request, callback) {
  var matches = /^wdk-client(\/(.*))?/.exec(request);
  if (matches != null) {
    if (matches[2]) {
      return callback(null, 'var Wdk.' + matches[2]);
    }
    else {
      return callback(null, 'var Wdk');
    }
  }
  callback(null, undefined); // XXX Will this break anything?
}