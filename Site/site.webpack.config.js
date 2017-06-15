var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var wdkRoot = path.resolve(__dirname, '../../WDK/View');
var baseConfig = require(path.join(wdkRoot, 'base.webpack.config'));

module.exports = function configure(additionalConfig) {
  return baseConfig.merge([{
    context: process.cwd(),
    output: {
      path: path.join(process.cwd(), 'dist'),
      filename: 'site-[name].bundle.js'
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
        'flux'         : 'Flux',
        'flux/utils'   : 'FluxUtils'
      }
    ],

    // Extract CSS into a separate file for each entry
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            use: {
              loader: 'css-loader',
              options: {
                sourceMap: true
              }
            },
            fallback: 'style-loader'
          })
        }
      ]
    },

    plugins: [
      new ExtractTextPlugin('site-[name].bundle.css')
    ]

  }, additionalConfig]);
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
