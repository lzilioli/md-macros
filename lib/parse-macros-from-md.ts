import cheerio from 'cheerio';
import { Macro, ParsedMacros, ParsedImage } from '@lib/typedefs';

export function parseMacrosFromMd(md: string): ParsedMacros {
	const macroRegex: RegExp = /\[\[((?:[\n]|[^\]])+)\]\]/gm;
	const inlineImgRegex: RegExp = /(!\[[^\]]*\]\([^)]+\))/gm;
	const inlineImgPartsRexex: RegExp = /!\[([^\]]*)\]\(([^)]+)\)/g;

	const custom: Macro[] = [];
	let macroMatch: RegExpExecArray = macroRegex.exec(md);
	while (macroMatch) {
		const macroText: string = macroMatch[1].trim();
		const fullMatch: string = macroMatch[0];
		let firstSpaceIndex: number = macroText.indexOf(' ');
		if (firstSpaceIndex === -1) {
			firstSpaceIndex = macroText.indexOf('\n');
		}
		let name: string;
		let argsString: string
		if (firstSpaceIndex === -1) {
			name = macroText;
			argsString = '';
		} else {
			name = macroText.substr(0, firstSpaceIndex).trim();
			argsString = macroText
				.substr(firstSpaceIndex + 1, macroText.length)
				.trim()
				.replace(/\n/g, ' ')
				.replace(/\t/g, ' ')
				.replace(/ {2}/g, ' ')
				.trim();
		}
		const $: cheerio = cheerio.load(`<div ${argsString}></div>`);
		const args: unknown = {
			...$('div').attr()
		};
		custom.push({
			name,
			args,
			fullMatch,
		});
		macroMatch = macroRegex.exec(md);
	}

	const img: ParsedImage[] = [];
	let imgMatch: RegExpExecArray = inlineImgRegex.exec(md);
	while (imgMatch) {
		const fullMatch: string = imgMatch[0].trim();
		inlineImgPartsRexex.lastIndex = 0;
		const partsMatch: RegExpExecArray = inlineImgPartsRexex.exec(fullMatch);
		const altText: string = partsMatch[1] || '';
		const urlAndTitle: string = partsMatch[2];
		const split: string[] = urlAndTitle.split(' ') as [string, string];
		const src: string = split.shift();
		let title: string = split.join(' ').trim();
		if (title.length && title.startsWith('"') && title.endsWith('"')) {
			title = title.substr(1, title.length - 2);
		} else if (title.length) {
			throw new Error(`Title should be wrapped in double quotes: ${title}`)
		}
		img.push({
			src,
			title,
			altText,
			fullMatch
		})
		imgMatch = inlineImgRegex.exec(md);
	}
	return {
		custom,
		img
	};
}
