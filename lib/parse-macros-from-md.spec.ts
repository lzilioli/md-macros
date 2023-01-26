import { parseMacrosFromMd } from "@lib/parse-macros-from-md";
import assert from "assert";
import { ParsedBlock, ParsedCodeBlock, ParsedMacros } from "./entries";

const EMPTY_PARSE_RESULTS: ParsedMacros = {
	custom: [],
	quotes: [],
	img: [],
	references: {},
	links: [],
	codeBlocks: [],
	tags: [],
	tasks: [],
	headers: [],
};

export async function test(): Promise<void> {
	describe( 'parseMacrosFromMd', () => {
		it('works with no args', () => {
			const macroText: string = `[[sampleMacro]]`;
			const macros: ParsedMacros = parseMacrosFromMd(macroText);
			assert.deepEqual(macros.custom, [{
				name: 'sampleMacro',
				args: {},
				fullMatch: macroText,
			}])
		});

		it('works with a single macro with one arg', () => {
			const macroText: string = `[[youtube url="test"]]`;
			const macros: ParsedMacros = parseMacrosFromMd(macroText);
			assert.deepEqual(macros.custom, [{
				name: 'youtube',
				args: {url: 'test'},
				fullMatch: macroText,
			}])
		});

		it('can parse multi-line arguments', () => {
			const macroText: string = `[[youtube
				url="test"
				arg1="val1"
			]]`;
			const macros: ParsedMacros = parseMacrosFromMd(macroText);
			assert.deepEqual(macros.custom, [{
				name: 'youtube',
				args: {url: 'test', arg1: 'val1'},
				fullMatch: macroText,
			}])
		});

		it('allows for arrays (for codeblocks)', () => {
			const macroText: string = `This is a document.

["yes", "no"]

Ya know?
`;
			const macros: ParsedMacros = parseMacrosFromMd(macroText);
			assert.deepEqual(macros, {
				custom: [],
				img: [],
				links: [],
				references: {},
			});
		});

		it('lets you escape macros', () => {
			// eslint-disable-next-line no-useless-escape
			const macroText: string = `\\[[youtube
				url="test"
				arg1="val1"
			]]`;
			const macros: ParsedMacros = parseMacrosFromMd(macroText);
			assert.deepEqual(macros.custom, []);
		});

		it('captures multiple macros', () => {
			const macro0Text: string = `[[youtube url="test1"]]`;
			const macro1Text: string = `[[youtube
				url="test2"
				arg1="val1"
			]]`;
			const md: string = `
				test string ${macro0Text}
				test string ${macro1Text}
			`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			assert.deepEqual(macros.custom[0], {
				name: 'youtube',
				args: {url: 'test1'},
				fullMatch: macro0Text,
			});

			assert.deepEqual(macros.custom[1], {
				name: 'youtube',
				args: {url: 'test2', arg1: 'val1'},
				fullMatch: macro1Text,
			})
		});

		it('captures image macros', () => {
			const macro0Text: string = `![alt text](www.example.com/example.png "Title Text")`;
			const macro1Text: string = `![alt text2](www.example.com/example.png "Title Text2")`;
			const md: string = `
test string ${macro0Text}
test string ${macro1Text}
			`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				img: [{
					isReferenceStyle: false,
					altText: "alt text",
					src: "www.example.com/example.png",
					title: "Title Text",
					fullMatch: macro0Text
				}, {
					isReferenceStyle: false,
					altText: "alt text2",
					src: "www.example.com/example.png",
					title: "Title Text2",
					fullMatch: macro1Text
				}],
			};
			assert.deepEqual(macros, expected);
		});

		it('captures image macros with no alt and title', () => {
			const macro0Text: string = `![](www.example.com/example.png "Title Text")`;
			const macro1Text: string = `![alt text2](www.example.com/example.png)`;
			const md: string = `
test string ${macro0Text}
test string ${macro1Text}
			`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				img: [{
					isReferenceStyle: false,
					altText: "",
					src: "www.example.com/example.png",
					title: "Title Text",
					fullMatch: macro0Text
				}, {
					isReferenceStyle: false,
					altText: "alt text2",
					src: "www.example.com/example.png",
					title: "",
					fullMatch: macro1Text
				}],
			};
			assert.deepEqual(macros, expected);
		});

		it('captures both types of macros together', () => {
			const macro0Text: string = `![alt text](www.example.com/example.png "Title Text")`;
			const macro1Text: string = `[[youtube
				url="test1"
			]]`;
			const md: string = `
test string ${macro0Text}
test string ${macro1Text}
			`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				custom: [{
					name: 'youtube',
					args: {url: 'test1'},
					fullMatch: macro1Text,
				}],
				img: [{
					isReferenceStyle: false,
					altText: "alt text",
					src: "www.example.com/example.png",
					title: "Title Text",
					fullMatch: macro0Text
				}],
			};
			assert.deepEqual(macros, expected);
		});

		it('sets task parent to null when no header precedes it', () => {
			const md: string = `Whats up?

- [ ] I want to have a checkbox
	- [x] Here's a thing I finished

Thank you for attending my talk.
			`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				headers: [],
				tasks: [{
					completed: false,
					content: "- [ ] I want to have a checkbox\n",
					indentLevel: 0,
					index: 11,
					length: 31,
					line: 2,
					parent: null,
				}, {
					completed: true,
					content: "\t- [x] Here's a thing I finished\n",
					indentLevel: 1,
					index: 43,
					length: 32,
					line: 3,
					parent: {
						completed: false,
						content: "- [ ] I want to have a checkbox\n",
						indentLevel: 0,
						index: 11,
						length: 31,
						line: 2,
						parent: null,
					},
				}]
			};
			assert.deepEqual(macros, expected);
		});

		it('does not complain about TODO checkboxes, and parses them out', () => {
			const md: string = `# This is a document

- [ ] I want to have a checkbox
- [x] Here's a thing I finished

Thank you for attending my talk.
			`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				headers: [{
					text: 'This is a document',
					content: '# This is a document',
					index: 0,
					length: 20,
					level: 1,
					line: 0,
				}],
				tasks: [{
					completed: false,
					content: "- [ ] I want to have a checkbox\n",
					indentLevel: 0,
					index: 22,
					length: 31,
					line: 2,
					parent: {
						text: 'This is a document',
						content: '# This is a document',
						index: 0,
						length: 20,
						level: 1,
						line: 0,
					},
				}, {
					completed: true,
					content: "- [x] Here's a thing I finished\n",
					indentLevel: 0,
					index: 54,
					length: 31,
					line: 3,
					parent: {
						text: 'This is a document',
						content: '# This is a document',
						index: 0,
						length: 20,
						level: 1,
						line: 0,
					},
				}]
			};
			assert.deepEqual(macros, expected);
		});

		it('parses out tags and captures their proper intent level', () => {
			const md: string = `# This is a document

- [ ] I want to have a checkbox
  - [ ] a child as well (2 spaces)
	- [ ] a child as well (1 tab)
- [x] Here's a thing I finished
  - [X] Here's a thing I finished
    - [x] Here's a thing I finished

1. [ ] Yo
2. [x] Yoooo

Thank you for attending my talk.
			`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				headers: [{
					text: 'This is a document',
					content: '# This is a document',
					index: 0,
					length: 20,
					level: 1,
					line: 0,
				}],
				tasks: [{
					completed: false,
					content: "- [ ] I want to have a checkbox\n",
					indentLevel: 0,
					index: 22,
					length: 31,
					line: 2,
					parent: {
						text: 'This is a document',
						content: '# This is a document',
						index: 0,
						length: 20,
						level: 1,
						line: 0,
					},
				}, {
					completed: false,
					content: "  - [ ] a child as well (2 spaces)\n",
					indentLevel: 1,
					index: 54,
					length: 34,
					line: 3,
					parent: {
						completed: false,
						content: "- [ ] I want to have a checkbox\n",
						indentLevel: 0,
						index: 22,
						length: 31,
						line: 2,
						parent: {
							text: 'This is a document',
							content: '# This is a document',
							index: 0,
							length: 20,
							level: 1,
							line: 0,
						},
					},
				}, {
					completed: false,
					content: "\t- [ ] a child as well (1 tab)\n",
					indentLevel: 1,
					index: 89,
					length: 30,
					line: 4,
					parent: {
						completed: false,
						content: "- [ ] I want to have a checkbox\n",
						indentLevel: 0,
						index: 22,
						length: 31,
						line: 2,
						parent: {
							text: 'This is a document',
							content: '# This is a document',
							index: 0,
							length: 20,
							level: 1,
							line: 0,
						},
					},
				}, {
					completed: true,
					content: "- [x] Here's a thing I finished\n",
					indentLevel: 0,
					index: 120,
					length: 31,
					line: 5,
					parent: {
						text: 'This is a document',
						content: '# This is a document',
						index: 0,
						length: 20,
						level: 1,
						line: 0,
					},
				}, {
					completed: true,
					content: "  - [X] Here's a thing I finished\n",
					indentLevel: 1,
					index: 152,
					length: 33,
					line: 6,
					parent: {
						completed: true,
						content: "- [x] Here's a thing I finished\n",
						indentLevel: 0,
						index: 120,
						length: 31,
						line: 5,
						parent: {
							text: 'This is a document',
							content: '# This is a document',
							index: 0,
							length: 20,
							level: 1,
							line: 0,
						},
					},
				}, {
					completed: true,
					content: "    - [x] Here's a thing I finished\n",
					indentLevel: 2,
					index: 186,
					length: 35,
					line: 7,
					parent: {
						completed: true,
						content: "  - [X] Here's a thing I finished\n",
						indentLevel: 1,
						index: 152,
						length: 33,
						line: 6,
						parent: {
							completed: true,
							content: "- [x] Here's a thing I finished\n",
							indentLevel: 0,
							index: 120,
							length: 31,
							line: 5,
							parent: {
								text: 'This is a document',
								content: '# This is a document',
								index: 0,
								length: 20,
								level: 1,
								line: 0,
							},
						},
					},
				}, {
					completed: false,
					content: "1. [ ] Yo\n",
					indentLevel: 0,
					index: 223,
					length: 9,
					line: 9,
					parent: {
						text: 'This is a document',
						content: '# This is a document',
						index: 0,
						length: 20,
						level: 1,
						line: 0,
					},
				}, {
					completed: true,
					content: "2. [x] Yoooo\n",
					indentLevel: 0,
					index: 233,
					length: 12,
					line: 10,
					parent: {
						text: 'This is a document',
						content: '# This is a document',
						index: 0,
						length: 20,
						level: 1,
						line: 0,
					},
				}]
			};
			assert.deepEqual(macros, expected);
		});

		it('captures references', () => {
			const md: string = `[arbitrary case-insensitive reference text]: https://www.mozilla.org
[1]: http://slashdot.org
[link text itself]: http://www.reddit.com
[logo]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 2"`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				references: {
					'arbitrary case-insensitive reference text': {
						value: 'https://www.mozilla.org',
						fullMatch: '[arbitrary case-insensitive reference text]: https://www.mozilla.org',
						title: '',
					},
					'1': {
						value: 'http://slashdot.org',
						fullMatch: '[1]: http://slashdot.org',
						title: '',
					},
					'link text itself': {
						value: 'http://www.reddit.com',
						fullMatch: '[link text itself]: http://www.reddit.com',
						title: '',
					},
					'logo': {
						value: 'https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png',
						fullMatch: '[logo]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 2"',
						title: "Logo Title Text 2",
					}
				},
			};
			assert.deepEqual(macros, expected);
		});

		it('captures links', () => {
			const md: string = `[hello2]([[getLink test="what"]] "test title tex2t")
[macroWHashAndTitle]([[getLink test="macro-hash-title"]]#ze-hash "mht")
[macroWHash]([[getLink test="macro-hash"]]#ze-hash2)
[hello](www.example.com "test title text")
![huh](www.example.com/test.png "test img title text")]
[hello][wat]
![hello][wat2]
![][wat2]
[oh and this]

[wat]:			www.example3.com
[wat2]: www.example4.com "Test title"
[oh and this]: www.example5.com
`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				custom: [{
					args: {
						test: "what",
					},
					fullMatch: "[[getLink test=\"what\"]]",
					name: "getLink",
				}, {
					args: {
						test: "macro-hash-title",
					},
					fullMatch: "[[getLink test=\"macro-hash-title\"]]",
					name: "getLink",
				}, {
					args: {
						test: "macro-hash",
					},
					fullMatch: "[[getLink test=\"macro-hash\"]]",
					name: "getLink",
				}],
				img: [{
					title: 'test img title text',
					src: 'www.example.com/test.png',
					altText: 'huh',
					isReferenceStyle: false,
					fullMatch: `![huh](www.example.com/test.png "test img title text")`
				}, {
					altText: "",
					fullMatch: "![hello][wat2]",
					isReferenceStyle: true,
					referenceKey: 'wat2',
					src: "www.example4.com",
					title: "hello",
				}, {
					altText: "",
					fullMatch: "![][wat2]",
					isReferenceStyle: true,
					referenceKey: 'wat2',
					src: "www.example4.com",
					title: "",
				}],
				references: {
					wat: {
						value: 'www.example3.com',
						title: '',
						fullMatch: '[wat]:			www.example3.com',
					},
					wat2: {
						value: 'www.example4.com',
						title: 'Test title',
						fullMatch: '[wat2]: www.example4.com "Test title"',
					},
					'oh and this': {
						fullMatch: "[oh and this]: www.example5.com",
						title: "",
						value: "www.example5.com",
					}
				},
				links: [{
					title: 'test title tex2t',
					href: '[[getLink test="what"]]',
					altText: 'hello2',
					isReferenceStyle: false,
					fullMatch: `[hello2]([[getLink test="what"]] "test title tex2t")`
				}, {
					title: 'mht',
					href: '[[getLink test="macro-hash-title"]]#ze-hash',
					altText: 'macroWHashAndTitle',
					isReferenceStyle: false,
					fullMatch: `[macroWHashAndTitle]([[getLink test="macro-hash-title"]]#ze-hash "mht")`
				}, {
					title: '',
					href: '[[getLink test="macro-hash"]]#ze-hash2',
					altText: 'macroWHash',
					isReferenceStyle: false,
					fullMatch: `[macroWHash]([[getLink test="macro-hash"]]#ze-hash2)`
				}, {
					title: 'test title text',
					href: 'www.example.com',
					altText: 'hello',
					isReferenceStyle: false,
					fullMatch: `[hello](www.example.com "test title text")`
				}, {
					altText: "",
					fullMatch: "[hello][wat]",
					href: "www.example3.com",
					isReferenceStyle: true,
					referenceKey: 'wat',
					title: "hello",
				}, {
					altText: "",
					fullMatch: "[oh and this]",
					href: "www.example5.com",
					isReferenceStyle: true,
					referenceKey: 'oh and this',
					title: "oh and this",
				}],
			};
			assert.deepEqual(macros, expected);
		});

		it('skips over reference-style links within code snippets', () => {
			const md: string = `
\`some-code\`\`some-more-code\`

\`\`\`
UGH!
\`\`\`


This is the offending code snippet: \`queryResults[<array index>].address\`

This is an offending code block:

\`\`\`
if (!_.isArray(results)) {
	results = [results];
}
\`\`\`
`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			macros.codeBlocks.forEach((codeBlock: ParsedCodeBlock): void => {
				// Check that all of the code block ranges are correct
				assert.strictEqual(codeBlock.content, md.substr(codeBlock.index, codeBlock.length));
			});
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				codeBlocks: [{
					index: 1,
					length: 11,
					content: "`some-code`",
					type: 'inline'
				},
				{
					index: 12,
					length: 16,
					content: "`some-more-code`",
					type: 'inline'
				},
				{
					index: 30,
					length: 12,
					content: "```\nUGH!\n```",
					type: 'block',
				},
				{
					index: 81,
					length: 37,
					content: "`queryResults[<array index>].address`",
					type: 'inline'
				},
				{
					index: 154,
					length: 58,
					content: "```\nif (!_.isArray(results)) {\n\tresults = [results];\n}\n```",
					type: 'block',
				}],
			};
			assert.deepEqual(macros, expected);
		});

		it('properly parses back-to-back code blocks', () => {
			const md: string = '\n`some-code``some-more-code`';
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				codeBlocks: [{
					content: '`some-code`',
					type: 'inline',
					index: 1,
					length: 11
				}, {
					content: '`some-more-code`',
					type: 'inline',
					index: 12,
					length: 16
				}],
			};
			macros.codeBlocks.forEach((codeBlock: ParsedCodeBlock): void => {
				// Check that all of the ranges are correct
				assert.strictEqual(codeBlock.content, md.substr(codeBlock.index, codeBlock.length));
			});
			assert.deepEqual(macros, expected);
		});

		it('parses tags from macros', () => {
			const md: string = `---
title: Pagination Shortcut
isDraft: true
thumbnail:
  icon: "asterisk"
---
#sample, #sample-tag

# Header

Hello

## Nested Header

Test file 1 contents #sample-4

#sample-3

These should get excluded:

[macroWHashAndTitle]([[getLink test="macro-hash-title"]]#ze-hash "mht")
[macroWHash]([[getLink test="macro-hash"]]#ze-hash2)
[Sublime Text's multiple selections feature](https://www.sublimetext.com#multiple-selections)
Hello this is the #3 rule. Exclude numbers. Jumpman #23, but allow stuff like #1stunna
but not #1: test but #what. is cool but should remove the period.`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				custom: [{
					args: {
						test: "macro-hash-title",
					},
					fullMatch: "[[getLink test=\"macro-hash-title\"]]",
					name: "getLink",
				}, {
					args: {
						test: "macro-hash",
					},
					fullMatch: "[[getLink test=\"macro-hash\"]]",
					name: "getLink",
				}],
				links: [{
					title: 'mht',
					href: '[[getLink test="macro-hash-title"]]#ze-hash',
					altText: 'macroWHashAndTitle',
					isReferenceStyle: false,
					fullMatch: `[macroWHashAndTitle]([[getLink test="macro-hash-title"]]#ze-hash "mht")`
				}, {
					title: '',
					href: '[[getLink test="macro-hash"]]#ze-hash2',
					altText: 'macroWHash',
					isReferenceStyle: false,
					fullMatch: `[macroWHash]([[getLink test="macro-hash"]]#ze-hash2)`
				}, {
					altText: "Sublime Text's multiple selections feature",
					fullMatch: "[Sublime Text's multiple selections feature](https://www.sublimetext.com#multiple-selections)",
					href: "https://www.sublimetext.com#multiple-selections",
					isReferenceStyle: false,
					title: "",
				}],
				headers: [{
					content: '# Header',
					index: 101,
					length: 8,
					level: 1,
					line: 8,
					text: 'Header'
				}, {
					content: '## Nested Header',
					index: 118,
					length: 16,
					level: 2,
					line: 12,
					text: 'Nested Header'
				}],
				tags: [{
					tag: "#sample",
					fullMatch: "#sample,",
					index: 79,
					length: 8,
				}, {
					tag: "#sample-tag",
					fullMatch: " #sample-tag",
					index: 87,
					length: 12,
				}, {
					tag: "#sample-4",
					fullMatch: " #sample-4",
					index: 156,
					length: 10,
				}, {
					tag: "#sample-3",
					fullMatch: "#sample-3",
					index: 168,
					length: 9,
				}, {
					tag: "#1stunna",
					fullMatch: " #1stunna",
					index: 503,
					length: 9,
				}, {
					tag: "#what",
					fullMatch: " #what",
					index: 533,
					length: 6,
				}]
			};
			assert.deepEqual(macros, expected);
		});

		it('parses a sole tag from a string', () => {
			const md: string = `#what`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				tags: [{
					tag: "#what",
					fullMatch: "#what",
					index: 0,
					length: 5,
				}]
			};
			assert.deepEqual(macros, expected);
		});

		it('skips over tags within blockquotes', () => {
			const md: string = `# Hello

> #header {
> 	// Other styling for header
> 	margin-left: 10px;
> 	@include respond-to(mobile) { margin-left: 0px; }
> }
`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				headers: [{
					content: '# Hello',
					index: 0,
					length: 7,
					level: 1,
					line: 0,
					text: 'Hello'
				}],
				quotes: [
					{
						content: `> #header {
> 	// Other styling for header
> 	margin-left: 10px;
> 	@include respond-to(mobile) { margin-left: 0px; }
> }
`,
						index: 9,
						length: 122,
					}
				],
			};
			assert.deepEqual(macros, expected);
			macros.quotes.forEach((codeBlock: ParsedCodeBlock): void => {
				// Check that all of the code block ranges are correct
				assert.strictEqual(
					md.substr(codeBlock.index, codeBlock.length),
					codeBlock.content,
				);
			});
		});

		it('skips over tags within code blocks', () => {
			const md: string = `# Hello
\`\`\`css
	#header {
		// Other styling for header
		margin-left: 10px;
		@include respond-to(mobile) { margin-left: 0px; }
	}
\`\`\`
`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
			};
			assert.deepEqual(macros.tags, expected.tags);
		});

		it('BUG FIX: code blocks dont throw off tags', () => {
			const md: string = `---
title: Privacy Policy - _______________
thumbnail:
  icon: lock
tags:
    - privacy
---
#privacy

1. \`CODE_BLOCK\` ____ \`ANOTHER_ONE\``;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				...EMPTY_PARSE_RESULTS,
				tags: [{
					tag: '#privacy',
					fullMatch: '#privacy',
					index: 92,
					length: 8
				}]
			};
			assert.deepEqual(macros.tags, expected.tags);
		});
	} );

	it('BUG FIX: phone number label not parsed as a tag', () => {
		const md: string = `This is a file

I am providing a phone #: xxx-yyy-zzz`;
		const macros: ParsedMacros = parseMacrosFromMd(md);
		const expected: ParsedMacros = {
			...EMPTY_PARSE_RESULTS,
		};
		assert.deepEqual(macros.tags, expected.tags);
	});

	it('extracts block quotes', () => {
		const md: string = `Hello what did you say? I remember.

> This is what you said.
> This is why you said it.
> You said it with a #tag but we didnt listen.

Ahh. Thats right.

> And then I said this.
>
> And you said that.

`;
		const macros: ParsedMacros = parseMacrosFromMd(md);
		[
			...macros.codeBlocks,
			...macros.quotes,
		]
		.forEach((block: ParsedBlock): void => {
			// Check that all of the code block ranges are correct
			assert.strictEqual(block.content, md.substr(block.index, block.length));
		});
		const expected: ParsedMacros = {
			...EMPTY_PARSE_RESULTS,
			quotes: [{
				content: '> This is what you said.\n' +
					'> This is why you said it.\n' +
					'> You said it with a #tag but we didnt listen.\n',
				index: 37,
				length: 99
			}, {
				content: '> And then I said this.\n>\n> And you said that.\n',
				index: 156,
				length: 47
			}],
		};
		assert.deepEqual(macros.quotes, expected.quotes);
		assert.deepEqual(macros.tags, expected.tags);
	});

	it('doesnt throw on this list', () => {
		const md: string = `
* Instead of \`{ foo: foo }\`, you can just do \`{ foo }\` – known as a _property value shorthand_
* Computed property names, \`{ [prefix + 'Foo']: 'bar' }\`, where \`prefix: 'moz'\`, yields \`{ mozFoo: 'bar' }\`
* You can’t combine computed property names and property value shorthands, \`{ [foo] }\` is invalid

`;
		const macros: ParsedMacros = parseMacrosFromMd(md);
		[
			...macros.codeBlocks,
			...macros.quotes,
		]
		.forEach((block: ParsedBlock): void => {
			// Check that all of the code block ranges are correct
			assert.strictEqual(block.content, md.substr(block.index, block.length));
		});
		const expected: ParsedMacros = {
			...EMPTY_PARSE_RESULTS,
			codeBlocks: [{
				content: "`{ foo: foo }`",
				index: 14,
				length: 14,
				type: "inline",
			}, {
				content: "`{ foo }`",
				index: 46,
				length: 9,
				type: "inline",
			}, {
				content: "`{ [prefix + 'Foo']: 'bar' }`",
				index: 123,
				length: 29,
				type: "inline",
			}, {
				content: "`prefix: 'moz'`",
				index: 160,
				length: 15,
				type: "inline",
			}, {
				content: "`{ mozFoo: 'bar' }`",
				index: 184,
				length: 19,
				type: "inline",
			}, {
				content: "`{ [foo] }`",
				index: 279,
				length: 11,
				type: "inline",
			}],
		};
		assert.deepEqual(macros, expected);
	});
}
