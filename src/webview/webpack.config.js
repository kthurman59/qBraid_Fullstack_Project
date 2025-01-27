const path = require('path');

module.exports = {
    entry: {
        extension: './src/extension/extension.ts',
        webview: './src/webview/index.tsx',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    devtool: 'source-map',
    externals: {
        vscode: 'commonjs vscode'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
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
            }
        ]
    }
};
