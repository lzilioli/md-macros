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
	lists: ParsedListItem[];
}

export interface ParsedImage {
	src: string;
	title: string;
	altText: string;
	fullMatch: string;
	isReferenceStyle: boolean;
	referenceKey?: string;
	index: number; // offset of fullMatch in the markdown
	line: number; // 0-based line fullMatch starts on
}

export interface ParsedLink {
	href: string;
	title: string;
	altText: string;
	fullMatch: string;
	isReferenceStyle: boolean;
	referenceKey?: string;
	index: number; // offset of fullMatch in the markdown
	line: number; // 0-based line fullMatch starts on
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
	index: number; // offset of fullMatch in the markdown
	line: number; // 0-based line fullMatch starts on
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
	line: number; // 0-based line the tag is on
}

export interface ParsedBlock {
	index: number;
	length: number;
	content: string;
}

export type ParsedBlockQuote = ParsedBlock;

export type ParsedCodeBlock = ParsedBlock & {
	type: 'inline' | 'block';
	/** 0-based first and last lines of the code. For a fenced block these are the fence lines. */
	line: number;
	endLine: number;
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

/**
 * One list item (`- item`, `* item`, `+ item`, `1. item`, `1) item`), task or
 * not, as CommonMark reads the list. Nested items are separate entries that
 * point at their parent.
 */
export type ParsedListItem = ParsedBlock & {
	/** 0-based line of the item's marker. */
	line: number;
	/** 0-based last line of the item's own text: continuation lines, not nested items. */
	endLine: number;
	/** 0-based column of the marker on its line. */
	column: number;
	/** The marker as written: '-', '*', '+', or an ordered marker such as '1.' or '2)'. */
	marker: string;
	/** For a task, the character between the brackets (' ', 'x', '-', '/', ...); null for a plain item. */
	task: string | null;
	/** 0-based line of the item this one is nested under; null for an item at the top of its list. */
	parentLine: number | null;
	/** 0-based first and last lines of the outermost list the item belongs to. */
	listLine: number;
	listEndLine: number;
	/** The block id at the end of the item's text (`^my-id`), without the caret; '' when there is none. */
	blockId: string;
}
