const merge = require('webpack-merge');
const path = require( 'path' );
const nodeExternals = require('webpack-node-externals');

module.exports = merge([
	require('./webpack.base.js'),
	{
		target: 'node',
		externals: [nodeExternals()],
		entry: {
			'test-runner': path.resolve('test-runner.ts')
		},
		output: {
			path: path.resolve('dist/tests'),
			filename: '[name].js'
		},
		resolve: {
			alias: {
				lib: path.resolve( 'lib/' ),
				tests: path.resolve( 'tests/' )
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
