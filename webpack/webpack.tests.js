const merge = require('webpack-merge');
const path = require( 'path' );
const nodeExternals = require('webpack-node-externals');
const getWebpackEntryMap = require('./util/getWebpackEntryMap');
const appPaths = require('../app-paths')

module.exports = merge([
	require('./util/webpack.base.js'),
	{
		target: 'node',
		externals: [nodeExternals()],
		entry: getWebpackEntryMap(appPaths.testsFolder),
		output: {
			path: path.resolve(path.join(appPaths.buildFolder, appPaths.testsFolder)),
			filename: '[name].js'
		},
		resolve: {
			alias: {
				'@lzilioli/md-macros': path.resolve(path.join(appPaths.libFolder, 'entries') + '/index.ts'),
				'@examples': path.resolve(appPaths.examplesFolder)
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
