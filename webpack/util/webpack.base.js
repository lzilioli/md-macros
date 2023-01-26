const path = require( 'path' );
const appPaths = require('../../app-paths')
module.exports =  {
	devtool: 'inline-source-map',
	mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
	resolve: {
		extensions: ['.js', '.ts', '.json'],
		alias: {
			"app-paths": path.resolve("app-paths.js"),
            "@lib": path.resolve(appPaths.libFolder),
		}
	}
};
