
# md-macros

Extensible macro processing framework for markdown, written in TypeScript.

![lint, build, and test](https://github.com/lzilioli/md-macros/workflows/Node.js%20CI/badge.svg?branch=stable)

# Table Of Contents

-   [Overview](#overview)

    -   [Sample Use Case](#sample-use-case)

-   [Usage](#usage)

    -   [cli](#cli)

    -   [nodejs](#nodejs)

        -   [Typedefs](#typedefs)

        -   [Methods](#methods)

            -   [replaceMacrosInMd](#replacemacrosinmd)

                -   [Usage](#usage-1)

            -   [parseMacrosFromMd](#parsemacrosfrommd)

                -   [Usage](#usage-2)

            -   [Bundled macros](#bundled-macros)

                -   [youtube](#youtube)

                    -   [args](#args)

                -   [mdToc](#mdtoc)

                -   [inlineFile](#inlinefile)

                    -   [args](#args-1)

-   [Custom macros](#custom-macros)

# Overview

There have been lots of requests and proposals over the years for an official spec for a rich and extensible version of markdown. People want to be able to write clean and succinct text in their markdown files, and have it rendered into complex html components, without the need for  inline html in their markdown files.

* https://stackoverflow.com/questions/24580042/github-markdown-are-macros-and-variables-possible
* https://github.com/howardroark/Markdown-Macros

To John Gruber's (the creator of Markdown) credit, he designed Markdown to be lightweight, and he has stuck to his original spec. It is unlikely we will see an overhaul to the markdown specification that would bring features like macros or more rich rendering capabilities to the markdown language itself.

The best thing about markdown is that it's plain text. It is easy to `pre-` or `post-` process any markdown text without interfering with other steps of the text processing pipeline. This is how `mdmacros` works. Technically, this module can work on any text, not just markdown.

## Sample Use Case

If you want to embed a YouTube video in a markdown document without `mdmacros`, you'd do this:

```md
This is my regular markdown document. If I wanted to include
a youtube video embed, this is what I would do today:

<iframe width="560" height="315" src="<youtube-embed-url>"
    frameborder="0" allowfullscreen></iframe>
```

This is not ideal for two reasons:

1. This can get hairy for complex markup
2. Your content creators shouldnt have to know html to create rich, interactive content.

`md-macros` lets you define your own macros that enable you to simplify the same file to this:

```md
This is my super clean markdown document thanks to md-macros!
This is all I need to type in order to include a video.
[[youtube url="<youtube-embed-url>"]]
```

A clear improvement.

# Usage

mdmacros is available as a cli or a nodejs module.

## cli

You can run the bundled macros against any markdown file with:

```bash
mdmacros README.tmpl.md README.md
```

Out of the box you can use this to insert a table of contents section into your readme, by including a call to the `mdToc` macro, or to inline a file with a call to the `inlineFile` macro (both are documented below).

## nodejs

### Typedefs

```typescript
export type MacroMethod = (args: unknown, mdText: string) => Promise<string>;

export interface Macro {
	name: string;
	args: unknown;
	fullMatch: string;
}

// Returned from parseMacrosFromMd
export interface ParsedMacros {
	img: ParsedImage[];
	custom: Macro[];
	references: ParsedReferences;
	links: ParsedLink[];
	codeBlocks: ParsedCodeBlock[];
	tags: ParsedTag[];
	quotes: ParsedBlockQuote[];
	tasks: ParsedTask[];
}

export interface ParsedImage {
	src: string;
	title: string;
	altText: string;
	fullMatch: string;
	isReferenceStyle: boolean;
	referenceKey?: string;
}

export interface ParsedLink {
	href: string;
	title: string;
	altText: string;
	fullMatch: string;
	isReferenceStyle: boolean;
	referenceKey?: string;
}

export interface ParsedReferences {
	[key: string]: {
		value: string;
		title: string;
		fullMatch: string;
	};
}

export interface ParsedTag {
	tag: string;
	fullMatch: string;
	index: number;
	length: number;
}

export interface ParsedBlock {
	index: number;
	length: number;
	content: string;
}

export type ParsedBlockQuote = ParsedBlock;

export type ParsedCodeBlock = ParsedBlock & {
	type: 'inline' | 'block';
}

export type ParsedTask = ParsedBlock & {
	completed: boolean;
	line: number;
	indentLevel: number;
}
```

### Methods

#### replaceMacrosInMd

```
async function replaceMacrosInMd(
	md: string,
	macros: {[key: string]: MacroMethod},
	skipMacroNamePatterns: string[] = []
): Promise<string>`
```

This method is where all of the magic happens.

##### Usage

```typescript
import {replaceMacrosInMd, macros} from '@lzilioli/md-macros';

export async function replaceMacrosInMdUsageExample(): Promise<void> {
    const md: string = `Hello [[youtube url="<youtube embed url>"]]`;

    const rendered: string = await replaceMacrosInMd(md, {youtube: macros.youtube});

    console.log(rendered)
    /*
        Hello <iframe
            width="560"
            height="315"
            src="<youtube embed url>"
            frameborder="0"
            allowfullscreen
        ></iframe>
    */

    // How to skip an undefined macro
    const renderedWithSkipped: string = await replaceMacrosInMd(
        md,
        {},
        // tells the component to skip over the youtube macro
        // matched against macro names using minimatch
        // https://www.npmjs.com/package/minimatch
        ['*']
    );
    console.log(renderedWithSkipped);
    // Hello [[youtube url="<youtube embed url>"]]
}
```

#### parseMacrosFromMd

`function parseMacrosFromMd(md: string): ParsedMacros`

##### Usage

```typescript
import {parseMacrosFromMd, ParsedMacros} from '@lzilioli/md-macros';

export async function parseMacrosFromMdUsageExample(): Promise<void> {
    const md: string = `
Hello #tag [Link](/home) \`code\` [[youtube url="<youtube embed url>"]] ![alt text](www.example.com/example.png "Title Text")
    `;

    const macros: ParsedMacros = parseMacrosFromMd(md);

    console.log(macros)
    /*
        {
            custom: [{
                name: 'youtube',
                args: { url: '<youtube embed url>' },
                fullMatch: '[[youtube url="<youtube embed url>"]]'
            }],
            img: [{
                isReferenceStyle: false,
                altText: "alt text",
                src: "www.example.com/example.png",
                title: "Title Text",
                fullMatch: "![alt text](www.example.com/example.png \"Title Text\")"
            }],
            references: {},
            links: [{
                altText: 'Link',
                fullMatch: '[Link](/home)',
                href: '/home',
                isReferenceStyle: false,
                title: "",
            }],
            codeBlocks: [{
                content: '`code`',
                index: 26,
                length: 6
            }],
            tags: [{
                fullMatch: ' #tag',
                index: 6,
                length: 5,
                tag: '#tag'
            }]
        }
    */
}
```

#### Bundled macros

This package is intended to aid in the markdown processing pipeline by introducing the *concept* of macros. To that end, it doesn't provide many macros for consumption.

##### youtube

This macros is utilized in the above examples.

###### args

`url`: the embed url for the YouTube video

##### mdToc

This macro takes no arguments, and replaces the macro call with the table of contents for the file.

##### inlineFile

Inlines the contents of a file into the markdown document.
Used within this readme for the Typedefs section.

###### args

`path`: path to the file to inline

# Custom macros

You can easily write your own macro methods. Be sure to specify all macros that you call in your text in the `macros` argument to `replaceMacrosInMd` when you call it.

Macros are simple functions that take two arguments, and return a Promise for a string (refer to the `MacroMethod` typedef above.

The arguments passed to the method are as follows:

1. `args` object. This is a map containing whatever was passed to the macro in the markdown text. Each macro defines what goes in the args object that is passed to itself. The macro should take care to validate that it was passed the proper arguments, and throw if not.
2. `mdText: string`. The text for the original markdown document with no replacements having been made. This is useful for macros such as the `mdToc` macro, which needs the full document in order to generate and return a table of contents.

An example will help illustrate:

```typescript
import {replaceMacrosInMd, MacroMethod} from '@lzilioli/md-macros';

export async function creatingMacrosUsageExample(): Promise<void> {
    const macros: {[key: string]: MacroMethod} = {
        hello: async  (): Promise<string> => {
            return Promise.resolve('hello');
        },
        world: async (_args: unknown, mdText: string): Promise<string> => {
            // this example shows that mdText (the original text) is passed as
            // the second argument to the macro
            console.log(mdText);
            /*
                [[greeting greeting="Hello" name="User"]]
                    [[hello]] [[world]]
             */
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
    }

    const md: string = `[[greeting greeting="Hello" name="User"]]
    [[hello]] [[world]]`;

    await replaceMacrosInMd(md, macros)
    .then((rendered: string) => {
        console.log(rendered === `Hello, User:
    hello world`); // true
        console.log(rendered);
        /*
            Hello User:
                hello world
        */
    });
}
```
