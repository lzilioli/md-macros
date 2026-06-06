const merge = require('webpack-merge');
const path = require( 'path' );
const nodeExternals = require('webpack-node-externals');
const getWebpackEntryMap = require('./util/getWebpackEntryMap');
const appPaths = require('../app-paths')

module.exports = merge.merge([
	require('./util/webpack.base.js'),
	{
		target: 'node',
		// Bundle (don't externalize) @lzilioli/md-macros so the alias below points
		// it at the LOCAL source. Otherwise nodeExternals leaves it as a runtime
		// require() that resolves to the stale published copy in node_modules, and
		// the example tests would validate that instead of the code we're shipping.
		externals: [nodeExternals({ allowlist: ['@lzilioli/md-macros'] })],
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
