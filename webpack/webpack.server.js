const merge = require('webpack-merge');
const path = require( 'path' );
const nodeExternals = require('webpack-node-externals');

module.exports = merge([
	require('./webpack.base.js'),
	{
		target: 'node',
		externals: [nodeExternals()],
		entry: {
			index: path.resolve('index.ts')
		},
		output: {
			path: path.resolve('dist'),
			filename: '[name].js'
		},
		resolve: {
			alias: {
				lib: path.resolve( 'lib/' )
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
