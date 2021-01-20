import {some} from 'lodash';
import cheerio from 'cheerio';
import * as commonmark from 'commonmark';
import { Macro, ParsedMacros, ParsedImage, ParsedReferences, ParsedLink, ParsedCodeBlock, ParsedTag, ParsedBlockQuote, ParsedBlock, ParsedTask } from '@lib/typedefs';
import { CodeBlockExtractor, getCodeBlockExtractor, ExtractorResults } from './static-tree-helpers';

function isIndexWithinParsedBlocks(index: number, parsedBlocks: (ParsedBlock)[]): boolean {
	return some(parsedBlocks, (block: (ParsedBlock)): boolean => {
		return index >= block.index && index <= block.index + block.length;
	});
}

interface NodeWalker {
	next: () => WalkerEvent;
}

export interface WalkerEvent {
	entering: boolean;
	node: commonmark.Node;
}

export function parseMacrosFromMd(md: string): ParsedMacros {
	// The things we are parsing out of the file
	const codeBlocks: ParsedCodeBlock[] = [];
	const blockQuotes: ParsedBlockQuote[] = [];
	const tasks: ParsedTask[] = [];
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
	let index: number = 0;

	const codeBlockExtractor: CodeBlockExtractor = getCodeBlockExtractor();

	// https://github.com/commonmark/commonmark.js#usage
	while((event = walker.next())) {
		node = event.node;
		if (typeof node.literal === 'string') {
			index = md.indexOf(node.literal, index);
		}
		const codeBlockResults: ExtractorResults<ParsedCodeBlock> = codeBlockExtractor(index, event);
		index = codeBlockResults.index;
		codeBlockResults.items.forEach((block: ParsedCodeBlock) => {
			codeBlocks.push(block);
		});
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

	const splitMd: string[] = md.split('\n');
	let blockIdx: number = 0;
	let curBlockQuote: string[] = [];
	let curBlockQuoteStart: number = -1;
	// Parse out block quotes
	splitMd.forEach((line: string): void => {
		if (!line.startsWith('>')) {
			if (curBlockQuoteStart === -1) {
				blockIdx += line.length + 1;
				return;
			}
			curBlockQuote.push(line);
			const content: string = curBlockQuote.join('\n');
			blockQuotes.push({
				index: curBlockQuoteStart,
				length: content.length,
				content
			});
			curBlockQuote = [];
			curBlockQuoteStart = -1;
			blockIdx += line.length + 1;
			return;
		}
		if (curBlockQuoteStart === -1) {
			curBlockQuoteStart = blockIdx;
		}
		curBlockQuote.push(line);
		blockIdx += line.length + 1;
	});

	// Parse out tasks
	let taskIdx: number = 0;
	splitMd.forEach((line: string, lineNo: number): void => {
		if (/^\s*?\d+?\. \[x? ?\].*?$|^\s*?- \[x? ?\].*?$/gi.test(line)) {
			const completed: boolean = /\[X\]/i.test(line);
			const match: RegExpExecArray = /^\s+/.exec(line.replace(/\t/g, '  '));
			let indentLevel: number = 0;
			if (match) {
				indentLevel = match[0].length / 2;
			}
			tasks.push({
				index: taskIdx,
				length: line.length,
				content: `${line}\n`,
				line: lineNo,
				completed,
				indentLevel,
			});
		}
		taskIdx += line.length + 1;
	});

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
			throw new Error(`image or link title should be wrapped in double quotes: ${title}`)
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
		const isWithinCodeBlock: boolean = isIndexWithinParsedBlocks(referencesMatch.index, [
			...codeBlocks,
			...blockQuotes
		]);
		if (!isWithinCodeBlock) {
			const fullMatch: string = referencesMatch[0].trim();
			const refKey: string = referencesMatch[1].trim();
			const urlAndTitle: string = referencesMatch[2].trim();
			const split: string[] = urlAndTitle.split(' ');
			const value: string = split.shift();
			let title: string = split.join(' ').trim();
			if (title.length && title.startsWith('"') && title.endsWith('"')) {
				title = title.substr(1, title.length - 2);
			} else if (title.length) {
				throw new Error(`referenece title should be wrapped in double quotes: ${title}`)
			}
			if (references[refKey]) {
				throw new Error(`duplicate reference key encountered ${refKey}`);
			}
			references[refKey] = {
				value,
				fullMatch,
				title
			};
		}
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
			const isWithinCodeBlocks: boolean = isIndexWithinParsedBlocks(selfReferenceMatch.index, codeBlocks);
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
		const isWithinBlocks: boolean = isIndexWithinParsedBlocks(index, [
			...codeBlocks,
			...blockQuotes
		]);
		if (!isNumericalTag && !isWithinBlocks && tagText !== '#') {
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
		tags,
		tasks,
		quotes: blockQuotes
	};
}
