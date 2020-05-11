const path = require( 'path' );
module.exports =  {
	devtool: '#inline-source-map',
	mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
	resolve: {
		extensions: ['.js', '.ts', '.json'],
		alias: {
			hbs: path.resolve( 'views/' )
		}
	}
};
