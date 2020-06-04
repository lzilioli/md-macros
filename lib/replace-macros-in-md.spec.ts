import { replaceMacrosInMd } from "@lib/replace-macros-in-md";
import { MacroMethod } from "@lib/typedefs";
import assert from "assert";
import { macros } from "./entries";

export async function test(): Promise<void> {
	describe( 'replaceMacrosInMd', () => {
		it('throws if macro is missing', () => {
			assert.rejects(async ()=>{
				return replaceMacrosInMd(`[[sampleMacro]]`, {});
			}, new Error('md string contained macro sampleMacro, but no such macro was passed'));
		});

		it('throws if macro is not a function', () => {
			assert.rejects(async ()=>{
				return replaceMacrosInMd(`[[sampleMacro]]`, {
					sampleMacro: 'test' as unknown as MacroMethod
				});
			}, new Error('macro sampleMacro is not a function'));
		});

		it('works with no args', async () => {
			const macroText: string = `[[test]]`;
			const EXPECTED: string = 'BLAH BLAH';
			const finalText: string = await replaceMacrosInMd(macroText, {
				test: () => {return Promise.resolve(EXPECTED);}
			});
			assert.equal(finalText, EXPECTED);
		});

		it('passes the original text as the last argument', async () => {
			const EXPECTED: string = 'BLAH BLAH';
			const markdownText: string = `[[test yo="${EXPECTED}"]]`;
			const finalText: string = await replaceMacrosInMd(markdownText, {
				test: (args: {yo: string}, mdText: string) => {
					assert.equal(mdText, markdownText);
					return Promise.resolve(args.yo);
				}
			});
			assert.equal(finalText, EXPECTED);
		});

		it('captures multiple macros', async () => {
			const macro0Text: string = `[[youtube url="test1"]]`;
			const macro1Text: string = `[[youtube
				url="test2"
				arg1="val1"
			]]`;
			const md: string = `test string ${macro0Text}
				test string ${macro1Text}`;
			const finalText: string = await replaceMacrosInMd(md);
			assert.equal(finalText, `test string <iframe
width="560"
height="315"
src="test1"
frameborder="0"
allowfullscreen
></iframe>
				test string <iframe
width="560"
height="315"
src="test2"
frameborder="0"
allowfullscreen
></iframe>`);
		});

		it('allows macro calls within links', async () => {
			const md: string = `[[youtube url="test1"]]

[this is the link text]([[postLink slug="this-the-slug"]])
[this is the link text]([[postLink slug="this-the-slug2"]] "with a title")

[1]: www.example.com`;
			const finalText: string = await replaceMacrosInMd(md, {
				postLink: (args: {slug: string}): Promise<string> => {
					return Promise.resolve(`/blog/posts/${args.slug}`);
				},
				youtube: macros.youtube
			});
			assert.equal(finalText, `<iframe
width="560"
height="315"
src="test1"
frameborder="0"
allowfullscreen
></iframe>

[this is the link text](/blog/posts/this-the-slug)
[this is the link text](/blog/posts/this-the-slug2 "with a title")

[1]: www.example.com`);
		});

		it('replaces macros within links', async () => {
			const md: string = `[hello2]([[getLink test="what"]] "test title tex2t")
[macroWHashAndTitle]([[getLink test="macro-hash-title"]]#ze-hash "mht")
[macroWHash]([[getLink test="macro-hash"]]#ze-hash2)
[hello](www.example.com "test title text")
![huh](www.example.com/test.png "test img title text")]
[hello][wat]
![hello][wat2]

[wat]: www.example3.com
[wat2]: www.example4.com "Test title"
`;
			const actual: string = await replaceMacrosInMd(md, {
				getLink: (args: {test: string}) => {
					return Promise.resolve(`/path/to/${args.test}`);
				}
			});
			const expected: string = `[hello2](/path/to/what "test title tex2t")
[macroWHashAndTitle](/path/to/macro-hash-title#ze-hash "mht")
[macroWHash](/path/to/macro-hash#ze-hash2)
[hello](www.example.com "test title text")
![huh](www.example.com/test.png "test img title text")]
[hello][wat]
![hello][wat2]

[wat]: www.example3.com
[wat2]: www.example4.com "Test title"
`;
			assert.deepEqual(actual, expected);
		})

		it('works with the example from the readme', async () => {
			const macros: {[key: string]: MacroMethod} = {
				hello: (): Promise<string> => {
					return Promise.resolve('hello');
				},
				world: (): Promise<string> => {
					return Promise.resolve('world');
				},
				greeting: (args: {name: string; greeting: string}): Promise<string> => {
					// A more complex macro that takes arguments
					// it is a good idea to validate the args here
					if (!args.name) {
						throw new Error('no name specified');
					}
					if (!args.greeting) {
						throw new Error('no greeting specified');
					}
					return Promise.resolve(`${args.greeting}, ${args.name}:`);
				}
			};

			const md: string = `[[greeting greeting="Hello" name="User"]]\n\t[[hello]] [[world]]`;

			const rendered: string = await replaceMacrosInMd(md, macros);
			assert.equal(
				rendered,
				`Hello, User:\n\thello world`
			);
		});
	} );
}
