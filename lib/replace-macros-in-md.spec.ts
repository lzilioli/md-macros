import { replaceMacrosInMd } from "lib/replace-macros-in-md";
import * as macros from 'lib/macros';
import { MacroMethod } from "lib/typedefs";
import assert from "assert";

export async function test(): Promise<void> {
	describe( 'replaceMacrosInMd', () => {
		it('throws if macro is missing', () => {
			assert.throws(()=>{
				replaceMacrosInMd(`[[sampleMacro]]`, {});
			}, new Error('md string contained macro sampleMacro, but no such macro was passed'));
		});

		it('throws if macro is not a function', () => {
			assert.throws(()=>{
				replaceMacrosInMd(`[[sampleMacro]]`, {
					sampleMacro: 'test' as unknown as MacroMethod
				});
			}, new Error('macro sampleMacro is not a function'));
		});

		it('works with no args', () => {
			const macroText: string = `[[test]]`;
			const EXPECTED: string = 'BLAH BLAH';
			const finalText: string = replaceMacrosInMd(macroText, {
				test: () => {return EXPECTED;}
			});
			assert.equal(finalText, EXPECTED);
		});

		it('captures multiple macros', () => {
			const macro0Text: string = `[[youtube url="test1"]]`;
			const macro1Text: string = `[[youtube
				url="test2"
				arg1="val1"
			]]`;
			const md: string = `test string ${macro0Text}
				test string ${macro1Text}`;
			const finalText: string = replaceMacrosInMd(md, macros);
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

		it('works with the example from the readme', () => {
			const macros: {[key: string]: MacroMethod} = {
				hello: (): string => {
					return 'hello';
				},
				world: (): string => {
					return 'world';
				},
				greeting: (args: {name: string; greeting: string}): string => {
					// A more complex macro that takes arguments
					// it is a good idea to validate the args here
					if (!args.name) {
						throw new Error('no name specified');
					}
					if (!args.greeting) {
						throw new Error('no greeting specified');
					}
					return `${args.greeting}, ${args.name}:`;
				}
			};


			const md: string = `[[greeting greeting="Hello" name="User"]]\n\t[[hello]] [[world]]`;

			const rendered: string = replaceMacrosInMd(md, macros);
			assert.equal(
				rendered,
				`Hello, User:\n\thello world`
			);
        });
	} );
}
