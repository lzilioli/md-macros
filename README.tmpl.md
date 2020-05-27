
# md-macros

Extensible macro processing framework for markdown, written in TypeScript.

![Node.js CI](https://github.com/lzilioli/md-macros/workflows/Node.js%20CI/badge.svg?branch=master)

[[mdToc]]

# Overview

There have been lots of requests and proposals over the years for an official spec for a rich and extensible version of markdown. People want to be able to write clean and succinct text in their markdown files, and have it rendered into complex html components, without the need for  inline html in their markdown files.

* https://stackoverflow.com/questions/24580042/github-markdown-are-macros-and-variables-possible
* https://github.com/howardroark/Markdown-Macros

To John Gruber's (the creator of Markdown) credit, he designed Markdown to be lightweight, and he has stuck to his original spec. It is unlikely we will see an
overhaul to the markdown specification that would bring features like macros or more rich rendering capabilities to the markdown language itself.

The best thing about markdown is that it's plain text. It is easy to `pre-` or `post-` process any markdown text without interfering with other steps of the text
processing pipeline. This is how `mdmacros` works. Technically, this module can work on any text, not just markdown.

## Sample Use Case

If you want to embed a YouTube video in a markdown document without `mdmacros`, you'd do this:

```md
This is my regular markdown document. If I wanted to include a youtube video embed, this is what I would do today:

<iframe width="560" height="315" src="<youtube-embed-url>"
    frameborder="0" allowfullscreen></iframe>
```

This is not ideal for two reasons:

1. This can get hairy for complex markup
2. Your content creators shouldnt have to know html to create rich, interactive content.

`md-macros` lets you define your own macros that enable you to simplify the same file to this:

```md
This is my super clean markdown document thanks to md-macros! This is all I need to type in order to include a video.
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
[[inlineFile path="./lib/typedefs.ts"]]
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
[[inlineFile path="examples/replace-macros-in-md-usage.ts"]]
```

#### parseMacrosFromMd

`function parseMacrosFromMd(md: string): Macro[]`

##### Usage

```typescript
[[inlineFile path="examples/parse-macros-from-md-usage.ts"]]
```

#### Bundled macros

This package is intended to aid in the markdown processing pipeline by introducing
the *concept* of macros. To that end, it doesn't provide many macros for consumption.

##### youtube

This macros is utilized in the above examples.

###### args

`url`: the embed url for the YouTube video

##### mdToc

This macro takes no arguments, and replaces the macro call with the table of contents for the file.

##### inlineFile

Inlines the contents of a file into the markdown document.
Used within this readme for the Typedefs section.

### args

`path`: path to the file to inline

# Custom macros

You can easily write your own macro methods. Be sure to specify all macros that you call in your text in the `macros` argument to `replaceMacrosInMd` when you call it.

Macros are simple functions that take a single `args` object and return a string. They will
be invoked against the text you pass to `replaceMacrosInMd`, using the args specified there.

You define what goes in the args object that is passed to the macro method. An example will
help illustrate:

```typescript
[[inlineFile path="examples/creating-macros-usage.ts"]]
```
