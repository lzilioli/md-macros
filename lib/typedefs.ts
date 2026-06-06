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
	headers: ParsedHeader[];
	tasks: ParsedTask[];
	wikiLinks: WikiLink[];
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

export interface WikiLink {
	// Obsidian-style wiki links, all forms:
	//   [[Link Target]]
	//   [[Link Target|Title Text]]
	//   [[Link Target#header]]
	//   [[Link Target#header|Title Text]]
	//   [[#header]]                      (same-note link; targetName is "")
	//   [[Link Target#^blockId]]         (block reference)
	//   ![[Link Target]]                 (embed / transclusion; isEmbed is true)
	targetName: string; // "Link Target" — empty string for same-note links ([[#header]])
	header: string | ''; // the "#header" portion, "" if absent or if a block reference
	blockId: string | ''; // the "#^blockId" portion (without the caret), "" if absent
	title: string | ''; // explicit "|Title Text"; falls back to targetName (or header/blockId for same-note links)
	isEmbed: boolean; // true when the link is an embed/transclusion (prefixed with "!")
	fullMatch: string; // the full match of the wiki link, e.g. "[[Link Target#header|Title Text]]"
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
	/**
	 * Can be null if task is at top of page
	 */
	parent: ParsedHeader | ParsedTask | null;
}

export type ParsedHeader = ParsedBlock & {
	line: number;
	text: string;
	level: 1 | 2 | 3 | 4 | 5 | 6;
}
