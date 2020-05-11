import * as _ from 'lodash';

export interface LZComConfig {
	analyticsEnabled: boolean;
	excludePortFromURLs: boolean;
	contactEmail: string;
	emailSubject: string;
	includeDrafts: boolean;
	fbId: string;
	gaId: string;
	githubUsername: string;
	host: string;
	imagesPath: string;
	imagesServerPath: string;
	port: number;
	postsPath: string;
	postsServerPath: string;
	protocol: string;
	publicDirectory: string;
	selfLinkHosts: string[];
	siteName: string;
	siteNameShort: string;
	siteVersion: string;
	stackOverflowUserId: string;
	twitterHandle: string;
	viewsDir: string;
}

const defaultSettings: LZComConfig = {
	analyticsEnabled: false,
	contactEmail: 'elzee08+com@gmail.com',
	emailSubject: 'lukezilioli.solo',
	excludePortFromURLs: false,
	fbId: '602405439774295',
	gaId: 'UA-36080552-1',
	githubUsername: 'lzilioli',
	host: 'lukezilioli.solo',
	imagesPath: '../lukezilioli-blog-posts/images',
	imagesServerPath: '/blog/res',
	includeDrafts: true,
	port: Number(process.env.PORT) || 3000,
	postsPath: '../lukezilioli-blog-posts',
	postsServerPath: 'blog/post',
	protocol: 'http',
	publicDirectory: 'dist/public',
	selfLinkHosts: ['lukezilioli.com', 'luke-z.com'],
	siteName: 'Luke Zilioli',
	siteNameShort: 'LZ',
	siteVersion: require( '../package.json' ).version,
	stackOverflowUserId: '239242',
	twitterHandle: 'elzee',
	viewsDir: 'dist/views',
};

const herokuConfig: Partial<LZComConfig> = {
	analyticsEnabled: false,
	excludePortFromURLs: true,
	host: 'lukezilioli-com.herokuapp.com',
	imagesPath: 'public/blog-posts/images',
	includeDrafts: false,
	postsPath: 'public/blog-posts',
	protocol: 'https',
};

/**
 * Function that returns a configuration given a path to a file in which defaults
 * are specified, and a path to a file in which user overrides are specified.
 * Resulting object is defaultSettings object with userSettings object overriding.
 *
 * @return {Object}							The app's settings with user's overriding default
 */
export function loadAppSettings(): LZComConfig {
	let envSettings: Partial<LZComConfig> = {};
	if ( process.env.NODE_ENV === 'production' ) {
		envSettings = herokuConfig;
	}
	const finalConfig: LZComConfig = _.defaultsDeep({}, envSettings, defaultSettings);
	console.log(finalConfig);
	return finalConfig;
}
