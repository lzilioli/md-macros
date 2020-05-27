import assert from 'assert';
import * as macros from '@lib/macros';
import { replaceMacrosInMd } from './replace-macros-in-md';
import * as mock from 'mock-fs';

export async function test(): Promise<void> {
	describe( 'youtube macro', () => {
        it('throws if no url', () => {
            assert.throws((): void => {
				macros.youtube({} as {url: string}, '');
			}, new Error('youtube macro requires url argument'));
        });
        it('replaces the url properly', async () => {
			const url: string = 'TESTING';
			const result: string = await macros.youtube({url}, '');
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

	describe( 'inlineFile macro', () => {
		afterEach(()=>{
			mock.restore();
		})
		it('throws if no path', () => {
            assert.rejects((): Promise<string> => {
				return macros.inlineFile({} as {path: string}, '');
			}, new Error('inlineFile macro requires path argument'));
        });
        it('returns the contents of the file', async () => {
			const inlineText: string = 'TEST INLINE';
			mock({
				'test': {
					'test.md': inlineText
				}
			})
			const path: string = 'test/test.md';
			const result: string = await macros.inlineFile({path}, '');
			assert.equal(
				result,
				inlineText
			);
		});
		it('throws if the fine cant be found', async () => {
			mock({
				'test': {}
			})
			const path: string = 'test/test.md';
			assert.rejects(() => {
				return macros.inlineFile({path}, '');
			}, new Error('File not found: test/test.md'));
        });
        it('works in a greater context', async () => {
			const inlineText: string = `



			TEST INLINE




`;
			mock({
				'test': {
					'test.md': inlineText
				}
			})
			const path: string = 'test/test.md';
			const fileInline: string = `[[inlineFile path="${path}"]]`;
			const mdBeforeInline: string = 'What it to babeyyyyyy ';
			const mdAfterInline: string = 'Its pickle rickk!';
			const mdText: string = `${mdBeforeInline}${fileInline}${mdAfterInline}`;
			const result: string = await replaceMacrosInMd(mdText, {
				inlineFile: macros.inlineFile
			});
			assert.equal(
				result,
				`${mdBeforeInline}${inlineText.trim()}${mdAfterInline}`
			);
        });
	} );

	describe( 'mdToc macro', () => {
		it('returns the table of contents', async () => {
			const result: string = await macros.mdToc({}, `Hello this is a markdown file.

This is a short document, but it needs a

[[mdToc]]

# Some Other Section

This section contains uses another [[macro]], which remains untouched.

It doesnt do a whole lot, but its got a couple of sections.

# This is the first section

This is the contents of the first section

## It has a child

with some text too

# Yep!

I love it here

## Nope

jk

### Ok, it works!

finally...`);
			const expected: string = `# Table Of Contents

-   [Some Other Section](#some-other-section)

-   [This is the first section](#this-is-the-first-section)

    -   [It has a child](#it-has-a-child)

-   [Yep!](#yep)

    -   [Nope](#nope)

        -   [Ok, it works!](#ok-it-works)`;
			assert.equal(
				result,
				expected
			);
		});

		it('returns the full markdown file properly', async () => {
			const result: string = await replaceMacrosInMd(`Hello this is a markdown file.

This is a short document, but it needs a

[[mdToc]]

# Some Other Section

This section contains uses another [[macro]], which remains untouched.

It doesnt do a whole lot, but its got a couple of sections.

# This is the first section

This is the contents of the first section

## It has a child

with some text too

# Yep!

I love it here

## Nope

jk

### Ok, it works!

finally...`, {mdToc: macros.mdToc}, ['macro']);
			const expected: string = `Hello this is a markdown file.

This is a short document, but it needs a

# Table Of Contents

-   [Some Other Section](#some-other-section)

-   [This is the first section](#this-is-the-first-section)

    -   [It has a child](#it-has-a-child)

-   [Yep!](#yep)

    -   [Nope](#nope)

        -   [Ok, it works!](#ok-it-works)

# Some Other Section

This section contains uses another [[macro]], which remains untouched.

It doesnt do a whole lot, but its got a couple of sections.

# This is the first section

This is the contents of the first section

## It has a child

with some text too

# Yep!

I love it here

## Nope

jk

### Ok, it works!

finally...`;
			assert.equal(
				result,
				expected
			);
		});
	} );
}
