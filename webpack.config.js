const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Shared configuration
const commonConfig = {
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
    ],
  },
};

// Extension configuration (runs in Node.js)
const extensionConfig = {
  ...commonConfig,
  target: 'node',
  entry: {
    extension: path.resolve(__dirname, './src/extension/extension.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
};

// Webview configuration (runs in browser)
const webviewConfig = {
  ...commonConfig,
  target: 'web',
  entry: {
    webview: path.resolve(__dirname, './src/webview/index.tsx'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: false, // Don't clean on webview build as it would remove extension.js
  },
  plugins: [
    // Copy the styles.css file to the dist folder
    new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/webview/styles.css'),
                    to: path.resolve(__dirname, 'dist/webview/styles.css'),
                },
            ],
        }),
    ],
};

// Export both configurations
module.exports = [extensionConfig, webviewConfig];
