
# md-macros

Extensible macro processing framework for markdown, written in TypeScript.

![Node.js CI](https://github.com/lzilioli/md-macros/workflows/Node.js%20CI/badge.svg?branch=master)

# Table of Contents

-   [md-macros](#md-macros)
-   [Overview](#overview)
    -   [Sample Use Case](#sample-use-case)
-   [Usage](#usage)
    -   [cli](#cli)
    -   [nodejs](#nodejs)
        -   [Typedefs](#typedefs)
        -   [Methods](#methods)
            -   [replaceMacrosInMd](#replace-macros-in-md)
                -   [Usage](#usage)
            -   [parseMacrosFromMd](#parse-macros-from-md)
                -   [Usage](#usage)
            -   [Bundled macros](#bundled-macros)
                -   [youtube](#youtube)
                    -   [args](#args)
                -   [mdToc](#md-toc)
                -   [inlineFile](#inline-file)
                    -   [args](#args)
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
	headers: ParsedHeader[];
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
	/**
	 * Can be null if task is at top of page
	 */
	parent: ParsedHeader | ParsedTask | null;
}

export type ParsedHeader = ParsedBlock & {
	line: number;
	text: string;
	level: 1 | 2 | 3 | 4 | 5 | 6;
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
import { ParsedMacros, parseMacrosFromMd } from '@lzilioli/md-macros';

export async function parseMacrosFromMdUsageExample(): Promise<void> {
    const md: string = `
Hello #tag

[Link](/home)
Here is some inline code \`code\`

YouTube macro: [[youtube url="<youtube embed url>"]]

Image: ![alt text](www.example.com/example.png "Title Text")

[Reference style link][link1]

# Todo List

- [ ] What?
- [X] This is cool
    - [ ] This is a child task

# Multiple lists per note

- [ ] Nice!

[link1]: https://www.example.com
    `;

    const EXPECTED_PARSED_MACROS: ParsedMacros = parseMacrosFromMd(md);

    console.log(EXPECTED_PARSED_MACROS)
}
```

```typescript
import { ParsedMacros } from '@lib/typedefs';

export const EXPECTED_PARSED_MACROS: ParsedMacros = {
    custom: [{
        name: 'youtube',
        args: { url: '<youtube embed url>' },
        fullMatch: '[[youtube url="<youtube embed url>"]]'
    }],
    headers: [{
        content: "# Todo List",
        index: 207,
        length: 11,
        level: 1,
        line: 12,
        text: "Todo List",
    }, {
        content: "# Multiple lists per note",
        index: 283,
        length: 25,
        level: 1,
        line: 18,
        text: "Multiple lists per note",
    }],
    img: [{
        isReferenceStyle: false,
        altText: "alt text",
        src: "www.example.com/example.png",
        title: "Title Text",
        fullMatch: "![alt text](www.example.com/example.png \"Title Text\")"
    }],
    quotes: [],
    references: {
        "link1": {
            "fullMatch": "[link1]: https://www.example.com",
            "title": "",
            "value": "https://www.example.com",
        }
    },
    links: [{
        altText: 'Link',
        fullMatch: '[Link](/home)',
        href: '/home',
        isReferenceStyle: false,
        title: "",
    }, {
        altText: "",
        fullMatch: "[Reference style link][link1]",
        href: "https://www.example.com",
        isReferenceStyle: true,
        referenceKey: "link1",
        title: "Reference style link",
    }],
    codeBlocks: [{
        content: '`code`',
        type: 'inline',
        index: 46,
        length: 6
    }],
    tags: [{
        fullMatch: ' #tag',
        index: 6,
        length: 5,
        tag: '#tag'
    }],
    tasks: [{
        completed: false,
        content: "- [ ] What?\n",
        indentLevel: 0,
        index: 220,
        length: 11,
        line: 14,
        parent: {
            content: "# Todo List",
            index: 207,
            length: 11,
            level: 1,
            line: 12,
            text: "Todo List",
        }
    }, {
        completed: true,
        content: "- [X] This is cool\n",
        indentLevel: 0,
        index: 232,
        length: 18,
        line: 15,
        parent: {
            content: "# Todo List",
            index: 207,
            length: 11,
            level: 1,
            line: 12,
            text: "Todo List",
        }
    }, {
        completed: false,
        content: "    - [ ] This is a child task\n",
        indentLevel: 2,
        index: 251,
        length: 30,
        line: 16,
        parent: {
            completed: true,
            content: "- [X] This is cool\n",
            indentLevel: 0,
            index: 232,
            length: 18,
            line: 15,
            parent: {
                content: "# Todo List",
                index: 207,
                length: 11,
                level: 1,
                line: 12,
                text: "Todo List",
            }
        }
    }, {
        completed: false,
        content: "- [ ] Nice!\n",
        indentLevel: 0,
        index: 310,
        length: 11,
        line: 20,
        parent: {
            content: "# Multiple lists per note",
            index: 283,
            length: 25,
            level: 1,
            line: 18,
            text: "Multiple lists per note",
        }
    }]
};
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
