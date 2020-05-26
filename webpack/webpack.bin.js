const merge = require('webpack-merge');
const path = require( 'path' );
const webpack = require( 'webpack' );
const nodeExternals = require('webpack-node-externals');
const getWebpackEntryMap = require('./util/getWebpackEntryMap');
const appPaths = require('../app-paths')

module.exports = merge([
	require('./util/webpack.base.js'),
	{
		target: 'node',
		externals: [nodeExternals()],
		entry: getWebpackEntryMap(appPaths.binaryFolder),
		node: {
			__filename: true,
		},
		output: {
			path: path.resolve(path.join(appPaths.distFolder, appPaths.binaryFolder)),
			filename: '[name].js',
			library: 'mdMacros',
			libraryTarget: 'commonjs2'
		},
		resolve: {
			alias: {
			}
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: 'ts-loader',
					exclude: /node_modules/
				}
			]
		},
		plugins: [
			new webpack.BannerPlugin({
				banner: `#!/usr/bin/env node\n`,
				raw: true,
				entryOnly: true
			} )
		]
	}
]);
