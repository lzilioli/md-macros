import { parseMacrosFromMd } from "@lib/parse-macros-from-md";
import assert from "assert";
import { ParsedMacros } from "./entries";

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
				custom: [],
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
				references: {},
				links: [],
				codeBlocks: [],
				tags: [],
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
				custom: [],
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
				references: {},
				links: [],
				codeBlocks: [],
				tags: [],
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
				references: {},
				links: [],
				codeBlocks: [],
				tags: [],
			};
			assert.deepEqual(macros, expected);
		});

		it('does not complain about TODO checkboxes', () => {
			const md: string = `# This is a document

- [ ] I want to have a checkbox
- [x] Here's a thing I finished

Thank you for attending my talk.
			`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				custom: [],
				img: [],
				references: {},
				links: [],
				codeBlocks: [],
				tags: [],
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
				custom: [],
				img: [],
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
				links: [],
				codeBlocks: [],
				tags: [],
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
				codeBlocks: [],
				tags: [],
			};
			assert.deepEqual(macros, expected);
		});

		it('skips over reference-style links within code snippets', () => {
			const md: string = `
\`some-code\`\`some-more-code\`

\`\`\`
fuck all
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
			const expected: ParsedMacros = {
				custom: [],
				img: [],
				references: {},
				links: [],
				codeBlocks: [{
					index: 1,
					length: 11,
					content: "`some-code`"
				},
				{
					index: 12,
					length: 16,
					content: "`some-more-code`"
				},
				{
					index: 30,
					length: 16,
					content: "```\nfuck all\n```"
				},
				{
					index: 43,
					length: 43,
					content: "```\n\n\nThis is the offending code snippet: `"
				},
				{
					index: 119,
					length: 42,
					content: "```\n\nThis is an offending code block:\n\n```"
				},
				{
					index: 158,
					length: 58,
					content: "```\nif (!_.isArray(results)) {\n\tresults = [results];\n}\n```"
				}],
				tags: []
			};
			assert.deepEqual(macros, expected);
		});

		it('properly parses back-to-back code blocks', () => {
			const md: string = `
\`some-code\`\`some-more-code\`
`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
				custom: [],
				img: [],
				references: {},
				links: [],
				codeBlocks: [{
					content: '`some-code`',
					index: 1,
					length: 11
				}, {
					content: '`some-more-code`',
					index: 12,
					length: 16
				}],
				tags: []
			};
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
Hello this is the #1 rule. Exclude numbers. Jumpman #23, but allow stuff like #1stunna`;
			const macros: ParsedMacros = parseMacrosFromMd(md);
			const expected: ParsedMacros = {
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
				img: [],
				references: {},
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
				codeBlocks: [],
				tags: [{
					tag: "#sample",
					fullMatch: "#sample,",
				}, {
					tag: "#sample-tag",
					fullMatch: " #sample-tag",
				}, {
					tag: "#sample-4",
					fullMatch: " #sample-4",
				}, {
					tag: "#sample-3",
					fullMatch: "#sample-3",
				}, {
					tag: "#1stunna",
					fullMatch: " #1stunna",
				}]
			};
			assert.deepEqual(macros, expected);
		});
	} );
}
