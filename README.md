
# md-macros

![Node.js CI](https://github.com/lzilioli/md-macros/workflows/Node.js%20CI/badge.svg?branch=master)

Extensible macro processing framework for markdown, written in TypeScript.

# Overview

There have been lots of requests and proposals over the years for an official spec
for a slightly more rich and extensible version of markdown. Specifically, people
want to be able to write clean and succicnt text in their markdown files, and have
it rendered into complex html components, without the need for writing muddy inline
html in their otherwise clean markdown files.

* https://stackoverflow.com/questions/24580042/github-markdown-are-macros-and-variables-possible
* https://github.com/howardroark/Markdown-Macros

To John Gruber's (the creator of Markdown) credit, he designed Markdown to be lightweight
and he has largely stuck to his original spec, so it is unlikely we will ever see an
overhaul to the markdown specification that would bring features like macros or
more rich rendering capabilities to the markdown language itself.

Luckily, markdown is just text at some stage of a rendering pipeline. Thus, it is easy to
pre- or post- process any markdown text without interfering with other steps of the text
processing pipeline.

# What is a md-macros

Typically, the pipeline for rendering markdown text to html is very simple:

```
    <markdown text input>  => markdown => <html text output>
```

This works for simple markdown that contains some hyperlinks, tables, etc. However,
what if we wanted to, for example, embed a youtube iframe within our resulting html?

Typically, we would insert the html straight into the markdown file as follows:

```md
This is my super clean markdown document. Here's a video:

<iframe width="560" height="315" src="<youtube-embed-url>"
    frameborder="0" allowfullscreen></iframe>
```

This is a somewhat innocuous example, but if we are building a blog and we want any
level of more rich interactions within our post content, this can get hairy fast.


md-macros modifiies the markdown rendering pipeline as follows:

```
    <markdown text input> => md-macros  => markdown => <html text output>
```

and enables the preceding markdown example to be cleaned up as follows:

```md
This is my super clean markdown document. Here's a video:
[[youtube url="<youtube-embed-url>"]]
```

This is much cleaner and easier to read.

# API

## Typedefs

```typescript
export type MacroMethod = (args: unknown) => string;

export interface Macro {
	name: string;
	args: unknown;
	fullMatch: string;
}
```

## Methods

### replaceMacrosInMd

`function replaceMacrosInMd(md: string, macros: {[key: string]: MacroMethod}): striing`

This method is where all of the magic happens.

#### Usage

```typescript
import {replaceMacrosInMd, macros} from 'md-macros';

const md: string = `
    Hello [[youtube url="<youtube embed url>"]]
`;

const rendered: string = replaceMacrosInMd(md, {youtube: macros.youtube});

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
```

### parseMacrosFromMd

`function parseMacrosFromMd(md: string): Macro[]`

#### Usage

```typescript
import {parseMacrosFromMd, Macro} from 'md-macros';

const md: string = `
    Hello [[youtube url="<youtube embed url>"]]
`;

const macros: Macro[] = parseMacrosFromMd(md);

console.log(macros)
/*
    [{
        name: 'youtube',
        args: { url: '<youtube embed url>' },
        fullMatch: '[[youtube url="<youtube embed url>"]]'
    }]
*/
```

## macros

This package is intended to aid in the markdown processing pipeline by introducing
the *concept* of macros. To that end, it doesn't provide many macros for consumption.

The only macro currently exported by this repo is the `youtube` macro, which has been
used in the above examples.

If you'd like to write your own macro method, you can, just be sure to specify all macros
thay you call in your text in the `macros` argument to `replaceMacrosInMd` when you call it.

### Creating a macro

Macros are simple functions that take a single `args` object and return a string. They will
be invoked against the text you pass to `replaceMacrosInMd`, using the args specified there.

You define what goes in the args object that is passed to the macro method. An example will
help illustrate:

```typescript
import {replaceMacrosInMd, MacroMethod} from 'md-macros';

const md: string = `
[[greeting greeting="Hello" name="User"]]
    [[hello]][[world]]
`;

const macros: {[key: string]: MacroMethod} = {
    hello: (_ags: {}): string => {
        return 'hello';
    },
    world: (_ags: {}): string => {
        return 'world';
    },
    greeting: (args: {name: string, greeting: string}): string => {
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
}

const rendered: string = replaceMacrosInMd(md, macros);

console.log(rendered)
/*
    Hello User:
        hello world
*/
```
