export type MacroMethod = (args: unknown, mdText: string) => Promise<string>;

export interface Macro {
	name: string;
	args: unknown;
	fullMatch: string;
}

// Returned from parseMacrosFromMd
export interface ParsedMacros {
	img: ParsedImage[];
	custom: Macro[];
	references: ParsedReferences;
	links: ParsedLink[];
	codeBlocks: ParsedCodeBlock[];
	tags: ParsedTag[];
	quotes: ParsedBlockQuote[];
	tasks: ParsedTask[];
}

export interface ParsedImage {
	src: string;
	title: string;
	altText: string;
	fullMatch: string;
	isReferenceStyle: boolean;
	referenceKey?: string;
}

export interface ParsedLink {
	href: string;
	title: string;
	altText: string;
	fullMatch: string;
	isReferenceStyle: boolean;
	referenceKey?: string;
}

export interface ParsedReferences {
	[key: string]: {
		value: string;
		title: string;
		fullMatch: string;
	};
}

export interface ParsedTag {
	tag: string;
	fullMatch: string;
	index: number;
	length: number;
}

export interface ParsedBlock {
	index: number;
	length: number;
	content: string;
}

export type ParsedBlockQuote = ParsedBlock;

export type ParsedCodeBlock = ParsedBlock & {
	type: 'inline' | 'block';
}

export type ParsedTask = ParsedBlock & {
	completed: boolean;
	line: number;
	indentLevel: number;
}
