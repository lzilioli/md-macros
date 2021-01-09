import {some} from 'lodash';
import cheerio from 'cheerio';
import * as commonmark from 'commonmark';
import { Macro, ParsedMacros, ParsedImage, ParsedReferences, ParsedLink, ParsedCodeBlock, ParsedTag } from '@lib/typedefs';

function isIndexWithinCodeBlocks(index: number, codeBlocks: ParsedCodeBlock[]): boolean {
	return some(codeBlocks, (codeBlock: ParsedCodeBlock): boolean => {
		return index >= codeBlock.index && index <= codeBlock.index + codeBlock.length;
	});
}

interface NodeWalker {
	next: () => WalkerEvent;
}

interface WalkerEvent {
	entering: boolean;
	node: commonmark.Node;
}

export function parseMacrosFromMd(md: string): ParsedMacros {
	// The things we are parsing out of the file
	const codeBlocks: ParsedCodeBlock[] = [];
	const custom: Macro[] = [];
	const img: ParsedImage[] = [];
	const links: ParsedLink[] = [];
	const references: ParsedReferences = {};
	const tags: ParsedTag[] = [];

	// Markdown parser which will help us walk the tree
	const reader: commonmark.Parser = new commonmark.Parser();
	const parsed: commonmark.Node = reader.parse(md);
	const walker: NodeWalker = parsed.walker();

	// Variables used while walking the tree
	let event: WalkerEvent | null;
	let node: commonmark.Node;
	let areWeInCodeBlock: boolean = false;
	let index: number = 0;

	// https://github.com/commonmark/commonmark.js#usage
	while((event = walker.next())) {
		node = event.node;
		if (typeof node.literal === 'string') {
			index = md.indexOf(node.literal, index);
		}
		if (node.type === 'code_block' || node.type === 'code') {
			areWeInCodeBlock = event.entering;
		} else {
			areWeInCodeBlock = false;
		}
		if (areWeInCodeBlock) {
			let codeBlockText: string = node.literal;
			if (node.type === 'code') {
				// There is a discrepancy between the commonmark spec/behavior
				// and the explicit spec of md-macros. The following snippet:
				// 		`code1``code2`
				// is parsed as a single code node by commonmark, with value
				//		code1``code2`
				// md-macros explitily tests for this case, and wants to treat
				// it as two distinct code blocks:
				// 		1. `code1`
				// 		2. `code2`
				// If the following if check passes, this means we have
				// encountered the aforementioned discrepancy. Inside of the
				// if statement, we take the single code block as spit out
				// by commonmark, and map it to two distinct codeblocks within
				// our codeBlocks array.
				if (codeBlockText.indexOf('``') !== -1) {
					const splitText: string[] = codeBlockText.split('``');
					const tmpCodeBlockText: string = `\`${splitText[0]}\``;
					index--;
					codeBlocks.push({
						index,
						length: tmpCodeBlockText.length,
						content: tmpCodeBlockText
					});
					index += (tmpCodeBlockText.length + 1);
					codeBlockText = splitText[1];
				}
				codeBlockText = `\`${codeBlockText}\``;
				index -= 1;
			} else {
				codeBlockText = `\`\`\`\n${codeBlockText}\n\`\`\``
				index -= 4;
			}
			codeBlocks.push({
				index,
				length: codeBlockText.length,
				content: codeBlockText
			});
		}
	}

	const macroRegex: RegExp = /[\\]{0,1}\[\[((?:[\n]|[^\]])+)\]\]/gm;
	const inlineImgOrLinkRegex: RegExp = /!{0,1}\[([^\]]*)\]\(([^)]+)\)/gm;
	const inlineImgPartsRexex: RegExp = /\[([^\]]*)\]\(([^)]+)\)/g;
	const referenceValsRegex: RegExp = /\[([^\]]+)\]:\s(.*)/gm;
	const referenceImgOrLinkRegex: RegExp = /!{0,1}\[([^\]]*)\]\[([^\]]+)\]/gm;
	const selfReferenceRegex: RegExp = /!{0,1}[^\]]\[([^\]]+)][^[:(\]]/gm;
	const tagRegex: RegExp = /\s(#[^\s,#,\])]+),?|^(#[^\s,#,\])]+),?/gms;

	// commonmark was added after this repo was created. At present, we only use
	// the commonmark walker for parsing code blocks out of the markdown string.
	// We did so above, before declaring the regex variables.
	// Below this comment, we parse remaining macros out of the markdown
	// the old fashioned way: with regex.
	//
	// When fixing bugs related to entities being parsed using regex, try to
	// factor their parsing into the tree walk above. In most cases, switching
	// to the commonmark parser will likely be the only code change that is
	// necessary.

	let macroMatch: RegExpExecArray = macroRegex.exec(md);
	while (macroMatch) {
		const macroText: string = macroMatch[1].trim();
		const fullMatch: string = macroMatch[0];
		if (fullMatch.startsWith('\\')) {
			macroMatch = macroRegex.exec(md);
			continue;
		}
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

	let imageOrLinkMatch: RegExpExecArray = inlineImgOrLinkRegex.exec(md);
	while (imageOrLinkMatch) {
		const fullMatch: string = imageOrLinkMatch[0].trim();
		inlineImgPartsRexex.lastIndex = 0;
		const partsMatch: RegExpExecArray = inlineImgPartsRexex.exec(fullMatch);
		const altText: string = partsMatch[1] || '';
		const urlAndTitle: string = partsMatch[2];
		let src: string;
		let title: string;
		if (urlAndTitle.startsWith('[[')) {
			const endOfMacroCall: number = urlAndTitle.indexOf(']]') + 2;
			const restOfString: string = urlAndTitle.substr(endOfMacroCall, urlAndTitle.length);
			if (restOfString.startsWith(' ')) {
				src = urlAndTitle.substr(0, endOfMacroCall).trim();
				title = restOfString.trim();
			} else {
				const split: string[] = restOfString.split(' ');
				src = urlAndTitle.substr(0, endOfMacroCall).trim() + split.shift().trim();
				title = split.join(' ');
			}
		} else {
			const split: string[] = urlAndTitle.split(' ');
			src = split.shift();
			title = split.join(' ').trim();
		}
		if (title.length && title.startsWith('"') && title.endsWith('"')) {
			title = title.substr(1, title.length - 2);
		} else if (title.length) {
			throw new Error(`Title should be wrapped in double quotes: ${title}`)
		}
		if (fullMatch.startsWith('!')) {
			img.push({
				src,
				title,
				altText,
				fullMatch,
				isReferenceStyle: false
			});
		} else {
			links.push({
				href: src,
				title,
				altText,
				fullMatch,
				isReferenceStyle: false,
			});
		}
		imageOrLinkMatch = inlineImgOrLinkRegex.exec(md);
	}

	let referencesMatch: RegExpExecArray = referenceValsRegex.exec(md);
	while (referencesMatch) {
		const fullMatch: string = referencesMatch[0].trim();
		const refKey: string = referencesMatch[1].trim();
		const urlAndTitle: string = referencesMatch[2].trim();
		const split: string[] = urlAndTitle.split(' ');
		const value: string = split.shift();
		let title: string = split.join(' ').trim();
		if (title.length && title.startsWith('"') && title.endsWith('"')) {
			title = title.substr(1, title.length - 2);
		} else if (title.length) {
			throw new Error(`Title should be wrapped in double quotes: ${title}`)
		}
		if (references[refKey]) {
			throw new Error(`duplicate reference key encountered ${refKey}`);
		}
		references[refKey] = {
			value,
			fullMatch,
			title
		};
		referencesMatch = referenceValsRegex.exec(md);
	}

	let referencesImgOrLinkMatch: RegExpExecArray = referenceImgOrLinkRegex.exec(md);
	while (referencesImgOrLinkMatch) {
		const fullMatch: string = referencesImgOrLinkMatch[0].trim();
		const refText: string = referencesImgOrLinkMatch[1].trim();
		const refKey: string = referencesImgOrLinkMatch[2].trim();
		if (fullMatch.startsWith('!')) {
			img.push({
				src: (references[refKey] || {}).value,
				title: refText,
				altText: '',
				fullMatch,
				isReferenceStyle: true,
				referenceKey: refKey
			});
		} else {
			links.push({
				href: (references[refKey] || {}).value,
				title: refText,
				altText: '',
				fullMatch,
				isReferenceStyle: true,
				referenceKey: refKey
			});
		}
		referencesImgOrLinkMatch = referenceImgOrLinkRegex.exec(md);
	}

	let selfReferenceMatch: RegExpExecArray = selfReferenceRegex.exec(md);
	while (selfReferenceMatch) {
		const fullMatch: string = selfReferenceMatch[0].trim();
		const refKey: string = selfReferenceMatch[1].trim();
		if (fullMatch.startsWith('!')) {
			img.push({
				src: (references[refKey] || {}).value,
				title: refKey,
				altText: '',
				fullMatch,
				isReferenceStyle: true,
				referenceKey: refKey
			});
		} else if (fullMatch !== '[ ]' && fullMatch.toLowerCase() !== '[x]') {
			const isWithinCodeBlocks: boolean = isIndexWithinCodeBlocks(selfReferenceMatch.index, codeBlocks);
			if (!isWithinCodeBlocks) {
				links.push({
					href: (references[refKey] || {}).value,
					title: refKey,
					altText: '',
					fullMatch,
					isReferenceStyle: true,
					referenceKey: refKey
				});
			}
		}
		selfReferenceMatch = selfReferenceRegex.exec(md);
	}

	let tagsMatch: RegExpExecArray = tagRegex.exec(md);
	while(tagsMatch) {
		// regex has 2 groups, one for start of string, another for preceded by
		// white space. fall back to the latter match if the former didnt contain
		// anything
		let tagText: string = tagsMatch[1] || tagsMatch[2];
		let fullMatch: string = tagsMatch[0];
		if (tagText.endsWith(':') || tagText.endsWith('.')) {
			tagText = tagText.substr(0, tagText.length - 1);
			fullMatch = fullMatch.substr(0, fullMatch.length - 1);
		}
		let index: number = tagsMatch.index;
		if (fullMatch.startsWith('\n')) {
			fullMatch = fullMatch.substr(1);
			index++;
		}
		const isNumericalTag: boolean = /^#\d+$/gms.test(tagText);
		const isWithinCodeBlocks: boolean = isIndexWithinCodeBlocks(index, codeBlocks);
		if (!isNumericalTag && !isWithinCodeBlocks) {
			tags.push({
				tag: tagText,
				fullMatch,
				index,
				length: fullMatch.length
			});
		}
		tagsMatch = tagRegex.exec(md);
	}

	return {
		custom,
		img,
		references,
		links,
		codeBlocks,
		tags
	};
}
