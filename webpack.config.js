var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: path.resolve(__dirname , 'app', 'client'),
  devtool: 'source-map',
  entry: {
    app: './nodeapp.js',
    viewer: './viewer.js',
    vendor: ['angular', 'angular-route', 'lodash', 'socket.io-client']
  },
  output: {
    path: path.resolve(__dirname , 'build'),
    filename: '[name].bundle.js'
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */"vendor.bundle.js")
  ],
  module: {
    loaders: [{
      test: /\.css$/,
      loader: 'style!css'
    }]
  }
};