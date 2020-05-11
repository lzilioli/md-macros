import assert from 'assert';
import * as macros from 'lib/macros';

export async function test(): Promise<void> {
	describe( 'youtube macro', () => {
        it('throws if no url', () => {
            assert.throws((): void => {
				macros.youtube({} as {url: string});
			}, new Error('youtube macro requires url argument'));
        });
        it('replaces the url properly', () => {
			const url: string = 'TESTING';
			const result: string = macros.youtube({url});
			assert.equal(
				result,
				`<iframe
width="560"
height="315"
src="${url}"
frameborder="0"
allowfullscreen
></iframe>`
			);
        });
	} );
}
