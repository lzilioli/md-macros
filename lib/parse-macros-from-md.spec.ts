import { parseMacrosFromMd } from "@lib/parse-macros-from-md";
import assert from "assert";
import { ParsedBlock, ParsedCodeBlock, ParsedMacros, ParsedTag } from "./entries";
import { EMPTY_PARSE_RESULTS } from '@lib/EMPTY_PARSE_RESULTS';

export async function test(): Promise<void> {
	describe( 'parseMacrosFromMd', () => {
		it('works with no args', () => {
			const macroText: string = `[[macro:sampleMacro]]`;
			const macros: ParsedMacros = parseMacrosFromMd(macroText);
			assert.deepEqual(macros.custom, [{
				name: 'sampleMacro',
				args: {},
				fullMatch: macroText,
			}])
		});

		it('works with a single macro with one arg', () => {
			const macroText: string = `[[macro:youtube url="test"]]`;
			const macros: ParsedMacros = parseMacrosFromMd(macroText);
			assert.deepEqual(macros.custom, [{
				name: 'youtube',
				args: {url: 'test'},
				fullMatch: macroText,
			}])
		});

		it('can parse multi-line arguments', () => {
			const macroText: string = `[[macro:youtube
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
			const macroText: string = `\\[[macro:youtube
				url="test"
				arg1="val1"
			]]`;
			const macros: ParsedMacros = parseMacrosFromMd(macroText);
			assert.deepEqual(macros.custom, []);
		});

		it('captures multiple macros', () => {
			const macro0Text: string = `[[macro:youtube url="test1"]]`;
			const macro1Text: string = `[[macro:youtube
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
			const macro1Text: string = `[[macro:youtube
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
			const md: string = `[hello2]([[macro:getLink test="what"]] "test title tex2t")
[macroWHashAndTitle]([[macro:getLink test="macro-hash-title"]]#ze-hash "mht")
[macroWHash]([[macro:getLink test="macro-hash"]]#ze-hash2)
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
					fullMatch: "[[macro:getLink test=\"what\"]]",
					name: "getLink",
				}, {
					args: {
						test: "macro-hash-title",
					},
					fullMatch: "[[macro:getLink test=\"macro-hash-title\"]]",
					name: "getLink",
				}, {
					args: {
						test: "macro-hash",
					},
					fullMatch: "[[macro:getLink test=\"macro-hash\"]]",
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
					href: '[[macro:getLink test="what"]]',
					altText: 'hello2',
					isReferenceStyle: false,
					fullMatch: `[hello2]([[macro:getLink test="what"]] "test title tex2t")`
				}, {
					title: 'mht',
					href: '[[macro:getLink test="macro-hash-title"]]#ze-hash',
					altText: 'macroWHashAndTitle',
					isReferenceStyle: false,
					fullMatch: `[macroWHashAndTitle]([[macro:getLink test="macro-hash-title"]]#ze-hash "mht")`
				}, {
					title: '',
					href: '[[macro:getLink test="macro-hash"]]#ze-hash2',
					altText: 'macroWHash',
					isReferenceStyle: false,
					fullMatch: `[macroWHash]([[macro:getLink test="macro-hash"]]#ze-hash2)`
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

[macroWHashAndTitle]([[macro:getLink test="macro-hash-title"]]#ze-hash "mht")
[macroWHash]([[macro:getLink test="macro-hash"]]#ze-hash2)
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
					fullMatch: "[[macro:getLink test=\"macro-hash-title\"]]",
					name: "getLink",
				}, {
					args: {
						test: "macro-hash",
					},
					fullMatch: "[[macro:getLink test=\"macro-hash\"]]",
					name: "getLink",
				}],
				links: [{
					title: 'mht',
					href: '[[macro:getLink test="macro-hash-title"]]#ze-hash',
					altText: 'macroWHashAndTitle',
					isReferenceStyle: false,
					fullMatch: `[macroWHashAndTitle]([[macro:getLink test="macro-hash-title"]]#ze-hash "mht")`
				}, {
					title: '',
					href: '[[macro:getLink test="macro-hash"]]#ze-hash2',
					altText: 'macroWHash',
					isReferenceStyle: false,
					fullMatch: `[macroWHash]([[macro:getLink test="macro-hash"]]#ze-hash2)`
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
					index: 515,
					length: 9,
				}, {
					tag: "#what",
					fullMatch: " #what",
					index: 545,
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

		// Helper: the tag texts parsed out of a string.
		const tagsIn: (md: string) => string[] = (md: string): string[] =>
			parseMacrosFromMd(md).tags.map((t: ParsedTag): string => t.tag);

		it('rejects #tokens inside a fenced code block (CSS hex colors AND id selectors), by LOCATION not content', () => {
			// A fenced stylesheet — hex colors (#8C62AA) and id selectors
			// (#refresh-module-123) — must produce ZERO tags. A real tag in prose
			// outside the fence still parses. This is the principled fix: location,
			// not guessing at a token's shape.
			const md: string = `Here is a real tag: #ai-prompt

\`\`\`css
#refresh-module-1939011389 .icon { background: #8C62AA; }
.theme-dark { --hover: #A082C4; --field: #715A89; }
\`\`\`
`;
			assert.deepEqual(tagsIn(md), ['#ai-prompt']);
		});

		it('keeps ordinary word tags in prose — including ones that happen to look like hex (#cafe, #decade)', () => {
			// No content-based exclusion: we do NOT drop real words just because
			// they're valid hex. (Unfenced CSS is fixed by fencing it, not by
			// sniffing token contents.)
			assert.deepEqual(
				tagsIn('see #archive and #ai-prompt and #cafe and #decade'),
				['#archive', '#ai-prompt', '#cafe', '#decade'],
			);
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

	it('does not parse out wiki-style links as macros', () => {
		const md: string = `[[this is a wiki link]]
[[this is a wiki link|So is this]]
[[this is a wiki link#To A Section|This one links to a section]]
[[this is a wiki link#toasection|This one links to a section]]
`;
		const macros: ParsedMacros = parseMacrosFromMd(md);
		const expected: ParsedMacros = {
			...EMPTY_PARSE_RESULTS,
			wikiLinks: [
				{
					"targetName": "this is a wiki link",
					"header": "",
					"blockId": "",
					"title": "this is a wiki link",
					"isEmbed": false,
					"fullMatch": "[[this is a wiki link]]"
				},
				{
					"targetName": "this is a wiki link",
					"header": "",
					"blockId": "",
					"title": "So is this",
					"isEmbed": false,
					"fullMatch": "[[this is a wiki link|So is this]]"
				},
				{
					"targetName": "this is a wiki link",
					"header": "To A Section",
					"blockId": "",
					"title": "This one links to a section",
					"isEmbed": false,
					"fullMatch": "[[this is a wiki link#To A Section|This one links to a section]]"
				},
				{
					"targetName": "this is a wiki link",
					"header": "toasection",
					"blockId": "",
					"title": "This one links to a section",
					"isEmbed": false,
					"fullMatch": "[[this is a wiki link#toasection|This one links to a section]]"
				}
			],
		};
		assert.deepEqual(macros, expected);
	});

	it('parses a same-note header link ([[#header]]) with an empty target', () => {
		const macros: ParsedMacros = parseMacrosFromMd(`See [[#Punchlines]] below.\n`);
		assert.deepEqual(macros.wikiLinks, [{
			targetName: '',
			header: 'Punchlines',
			blockId: '',
			title: 'Punchlines',
			isEmbed: false,
			fullMatch: '[[#Punchlines]]',
		}]);
	});

	it('parses a same-note header link with an explicit alias', () => {
		const macros: ParsedMacros = parseMacrosFromMd(`Jump [[#Punchlines|to the jokes]].\n`);
		assert.deepEqual(macros.wikiLinks, [{
			targetName: '',
			header: 'Punchlines',
			blockId: '',
			title: 'to the jokes',
			isEmbed: false,
			fullMatch: '[[#Punchlines|to the jokes]]',
		}]);
	});

	it('parses a block reference ([[Target#^blockId]]) into blockId, not header', () => {
		const macros: ParsedMacros = parseMacrosFromMd(`Ref [[My Note#^abc123]].\n`);
		assert.deepEqual(macros.wikiLinks, [{
			targetName: 'My Note',
			header: '',
			blockId: 'abc123',
			title: 'My Note',
			isEmbed: false,
			fullMatch: '[[My Note#^abc123]]',
		}]);
	});

	it('parses a block reference with an alias', () => {
		const macros: ParsedMacros = parseMacrosFromMd(`[[My Note#^abc123|see this bit]]\n`);
		assert.deepEqual(macros.wikiLinks, [{
			targetName: 'My Note',
			header: '',
			blockId: 'abc123',
			title: 'see this bit',
			isEmbed: false,
			fullMatch: '[[My Note#^abc123|see this bit]]',
		}]);
	});

	it('parses an embed/transclusion (![[Target]]) with isEmbed true', () => {
		const macros: ParsedMacros = parseMacrosFromMd(`![[Some Note]]\n[[diagram.png]]\n`);
		assert.deepEqual(macros.wikiLinks, [
			{
				targetName: 'Some Note',
				header: '',
				blockId: '',
				title: 'Some Note',
				isEmbed: true,
				fullMatch: '![[Some Note]]',
			},
			{
				targetName: 'diagram.png',
				header: '',
				blockId: '',
				title: 'diagram.png',
				isEmbed: false,
				fullMatch: '[[diagram.png]]',
			},
		]);
	});

	it('does not throw on an unquoted inline link title; keeps it verbatim and still parses the rest', () => {
		const md: string = `[a link](http://example.com some title)\n\n[[Survivor]]\n`;
		let macros: ParsedMacros;
		assert.doesNotThrow((): void => {
			macros = parseMacrosFromMd(md);
		});
		assert.equal(macros.links.length, 1);
		assert.equal(macros.links[0].href, 'http://example.com');
		assert.equal(macros.links[0].title, 'some title');
		// The wiki link after the malformed link still parses (parse not aborted).
		assert.deepEqual(macros.wikiLinks, [{
			targetName: 'Survivor',
			header: '',
			blockId: '',
			title: 'Survivor',
			isEmbed: false,
			fullMatch: '[[Survivor]]',
		}]);
	});

	it('does not throw on duplicate reference keys; first definition wins', () => {
		const md: string = `[ref]: http://first.com\n[ref]: http://second.com\n`;
		let macros: ParsedMacros;
		assert.doesNotThrow((): void => {
			macros = parseMacrosFromMd(md);
		});
		assert.equal(macros.references['ref'].value, 'http://first.com');
	});

	it('does not parse wiki links inside fenced code blocks', () => {
		const md: string = [
			'A real one: [[Real Note]]',
			'',
			'```js',
			'const x = "[[" + file.path + "|" + file.name + "]]";',
			'```',
			'',
		].join('\n');
		const macros: ParsedMacros = parseMacrosFromMd(md);
		assert.deepEqual(macros.wikiLinks.map((w: { targetName: string }): string => w.targetName), ['Real Note']);
	});

	it('does not catastrophically backtrack on many unclosed [[macro: openers', () => {
		// A note that documents macro syntax contains lots of `[[macro:NAME`
		// tokens with no closing `]]`. The old `(?:[\n]|[^\]])+` macro body made
		// the regex explore an exponential number of partitions on this input and
		// peg the CPU forever. The single-path `[^\]]+` body parses it instantly.
		const openers: string = new Array(400)
			.fill('  17 [[macro:postLink without a closing bracket on this line')
			.join('\n');
		const md: string = `# Heading\n\n${openers}\n`;
		const start: number = Date.now();
		const macros: ParsedMacros = parseMacrosFromMd(md);
		const elapsedMs: number = Date.now() - start;
		// Linear behaviour finishes in single-digit ms; the old form ran for
		// minutes. A generous ceiling still fails loudly on a regression.
		assert.ok(elapsedMs < 1000, `parse took ${elapsedMs}ms (catastrophic backtracking regression)`);
		// No opener actually closes, so nothing is parsed as a macro.
		assert.deepEqual(macros.custom, []);
	});

	it('strips the Obsidian \\| pipe-escape from target and header', () => {
		const macros: ParsedMacros = parseMacrosFromMd(`[[Categories/_Index\\|Categories]] and [[Note#Section\\|Sec]]\n`);
		assert.deepEqual(macros.wikiLinks, [
			{
				targetName: 'Categories/_Index',
				header: '',
				blockId: '',
				title: 'Categories',
				isEmbed: false,
				fullMatch: '[[Categories/_Index\\|Categories]]',
			},
			{
				targetName: 'Note',
				header: 'Section',
				blockId: '',
				title: 'Sec',
				isEmbed: false,
				fullMatch: '[[Note#Section\\|Sec]]',
			},
		]);
	});
}
