const webpack = require( 'webpack' );
const merge = require('webpack-merge');
const path = require( 'path' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

module.exports = merge([
	require('./webpack.base.js'),
	{
		target: 'web',
		entry: {
			index: path.resolve( 'client/index.ts' )
		},
		output: {
			path: path.resolve('dist/public/build'),
			filename: '[name].js'
		},
		resolve: {
			alias: {
				client: path.resolve( 'client/' ),
				sass: path.resolve( 'client/sass/' )
			}
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: 'ts-loader',
					exclude: /node_modules/
				},
				{
					test: /\.js$/,
					use: 'ts-loader',
					exclude: /node_modules/
				},
				{
					test: /\.handlebars$/,
					use: 'handlebars-loader?rootRelative=../../client/'
				},
				{
					test: /\.s[ac]ss$/i,
					use: [
						MiniCssExtractPlugin.loader,
						// Translates CSS into CommonJS
						'css-loader',
						// Compiles Sass to CSS
						'sass-loader',
					],
				}
			]
		},
		plugins: [
			new webpack.ProvidePlugin( {
				$: 'jquery'
			} ),
			new MiniCssExtractPlugin({
				filename: "[name].css"
			})
		]
	}
]);
