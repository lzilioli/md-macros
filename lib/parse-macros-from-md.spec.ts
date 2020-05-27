import { parseMacrosFromMd } from "@lib/parse-macros-from-md";
import { Macro } from "@lib/typedefs";
import assert from "assert";

export async function test(): Promise<void> {
	describe( 'parseMacrosFromMd', () => {
        it('works with no args', () => {
			const macroText: string = `[[sampleMacro]]`;
			const macros: Macro[] = parseMacrosFromMd(macroText);
			assert.deepEqual(macros, [{
				name: 'sampleMacro',
				args: {},
				fullMatch: macroText,
			}])
		});

		it('works with a single macro with one arg', () => {
			const macroText: string = `[[youtube url="test"]]`;
			const macros: Macro[] = parseMacrosFromMd(macroText);
			assert.deepEqual(macros, [{
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
			const macros: Macro[] = parseMacrosFromMd(macroText);
			assert.deepEqual(macros, [{
				name: 'youtube',
				args: {url: 'test', arg1: 'val1'},
				fullMatch: macroText,
			}])
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
			const macros: Macro[] = parseMacrosFromMd(md);
			assert.deepEqual(macros[0], {
				name: 'youtube',
				args: {url: 'test1'},
				fullMatch: macro0Text,
			});

			assert.deepEqual(macros[1], {
				name: 'youtube',
				args: {url: 'test2', arg1: 'val1'},
				fullMatch: macro1Text,
			})
        });
	} );
}
