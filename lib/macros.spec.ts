import assert from 'assert';
import * as macros from '@lib/macros';
import { replaceMacrosInMd } from './replace-macros-in-md';

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

-   [Table Of Contents End](#table-of-contents-end)

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

-   [Table Of Contents End](#table-of-contents-end)

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
