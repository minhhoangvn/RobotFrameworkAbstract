var path = require("path")
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
var config = require('./webpack.base.config.js')


config.devtool = "#eval-source-map"

config.plugins = config.plugins.concat([
  new BundleTracker({filename: './webpack-stats.json'}),
])

config.module.loaders.push(
  { 
    test: /\.jsx?$/, 
    exclude: /node_modules/, 
    loaders: ['babel-loader'] }
)

module.exports = config