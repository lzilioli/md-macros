import { LZComConfig } from 'lib/settings';

export function getHostWithPort( config: LZComConfig ): string {
	let full: string = config.host;
	if( ( `${config.port}` ) !== '8080' && !config.excludePortFromURLs ) {
		full += `:${config.port}`;
	}
	return full;
}
