var config = require('./webpack.config.js');
var webpack = require('webpack');

config.debug = false;

//config.output.filename = '[name].[hash].bundle.js';
config.plugins.push(new webpack.optimize.OccurenceOrderPlugin());
config.plugins.push(new webpack.optimize.UglifyJsPlugin({
  minimize: true,
  sourceMap: true,
  compress: { warnings: false }
}));


// Try to fix compiling react in production mode
config.plugins.push(new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': JSON.stringify('production')
  }
}));

module.exports = config;
