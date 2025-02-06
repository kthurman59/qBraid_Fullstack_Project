// webpack.webview.config.js
const path = require('path');

module.exports = {
  mode: 'production', // or 'development' for a dev build
  target: 'web', // This bundle is for the browser environment
  entry: './src/webview/index.tsx',  // Update this path if your webview entry point is different
  output: {
    path: path.resolve(__dirname, 'dist', 'webview'),
    filename: 'webview.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  }
  // Do not mark "vscode" as external here.
};

