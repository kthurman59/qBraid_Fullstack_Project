// webpack.webview.config.js
const path = require('path');

module.exports = {
  mode: 'production',
  target: 'web', // build for the browser environment
  entry: './src/webview/index.tsx',  // your webview entry point
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
  // Do NOT add an "externals" section for vscode here.
};

