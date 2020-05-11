import { replaceMacrosInMd } from "lib/replace-macros-in-md";
import * as macros from 'lib/macros';
import { MacroMethod } from "lib/typedefs";
import assert from "assert";

export async function test(): Promise<void> {
	describe( 'replaceMacrosInMd', () => {
		it('throws if macro is missing', () => {
			assert.throws(()=>{
				replaceMacrosInMd(`[[sampleMacro]]`, {});
			});
		});

		it('throws if macro is not a function', () => {
			assert.throws(()=>{
				replaceMacrosInMd(`[[sampleMacro]]`, {
					sampleMacro: 'test' as unknown as MacroMethod
				});
			});
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
	} );
}
