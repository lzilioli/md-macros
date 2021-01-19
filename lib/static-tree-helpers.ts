import { ParsedBlockQuote, ParsedCodeBlock } from '@lib/typedefs';
import * as commonmark from 'commonmark';
import { WalkerEvent } from './parse-macros-from-md';

// Markdownn parsing and tree walking helpers

export interface ExtractorResults<T> {
	index: number;
	items: T[];
}
type Extractor<T> = (index: number, event: WalkerEvent) => ExtractorResults<T>;
export type CodeBlockExtractor = Extractor<ParsedCodeBlock>;

export function getCodeBlockExtractor(): CodeBlockExtractor {
	let areWeInCodeBlock: boolean = false;
	return (index: number, event: WalkerEvent): ExtractorResults<ParsedCodeBlock> => {
		const node: commonmark.Node = event.node;
		const codeBlocks: ParsedCodeBlock[] = [];
		if (node.type === 'code_block' || node.type === 'code') {
			areWeInCodeBlock = event.entering;
		} else {
			areWeInCodeBlock = false;
		}
		if (areWeInCodeBlock) {
			const type: 'inline' | 'block' = node.type === 'code' ? 'inline' : 'block';
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
						type,
						length: tmpCodeBlockText.length,
						content: tmpCodeBlockText,
					});
					index += (tmpCodeBlockText.length + 1);
					codeBlockText = splitText[1];
				}
				codeBlockText = `\`${codeBlockText}\``;
				index -= 1;
			} else {
				codeBlockText = `\`\`\`\n${codeBlockText}\`\`\``;
				index -= 4;
			}
			codeBlocks.push({
				index,
				type,
				length: codeBlockText.length,
				content: codeBlockText
			});
		}
		return {
			index,
			items: codeBlocks
		};
	};
}
