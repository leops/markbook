const path = require('path');
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');

module.exports = {
    entry: {
        bundle: ['babel-polyfill', './src/index.js'],
        build: ['babel-polyfill', './src/build.js'],
    },
    devtool: 'inline-source-map',

    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
        }],
    },

    plugins: [
        new StaticSiteGeneratorPlugin({
            entry: 'build',
        })
    ],

    devServer: {
        contentBase: path.join(__dirname, 'dist'),
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),

        library: 'hydrateEditor',
        libraryTarget: 'umd',
        libraryExport: 'default',
    },
};
