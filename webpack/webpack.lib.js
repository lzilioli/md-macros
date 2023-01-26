const merge = require('webpack-merge');
const path = require( 'path' );
const nodeExternals = require('webpack-node-externals');
const getWebpackEntryMap = require('./util/getWebpackEntryMap');
const appPaths = require('../app-paths')

module.exports = merge.merge([
	require('./util/webpack.base.js'),
	{
		target: 'node',
		externals: [nodeExternals()],
		entry: getWebpackEntryMap(appPaths.libFolder),
		output: {
			path: path.resolve(path.join(appPaths.distFolder, appPaths.libFolder)),
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
	}
]);
