import { ParsedMacros } from '@lib/typedefs';
import { EMPTY_PARSE_RESULTS } from '@lib/EMPTY_PARSE_RESULTS';

export const EXPECTED_PARSED_MACROS: ParsedMacros = {
    ...EMPTY_PARSE_RESULTS,
    custom: [{
        name: 'youtube',
        args: { url: '<youtube embed url>' },
        fullMatch: '[[macro:youtube url="<youtube embed url>"]]'
    }],
    headers: [{
        content: "# Todo List",
        index: 213,
        length: 11,
        level: 1,
        line: 12,
        text: "Todo List",
    }, {
        content: "# Multiple lists per note",
        index: 289,
        length: 25,
        level: 1,
        line: 18,
        text: "Multiple lists per note",
    }, {
        "content": "# Wiki Links!",
        "index": 363,
        "length": 13,
        "level": 1,
        "line": 24,
        "text": "Wiki Links!",
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
    wikiLinks: [
    {
        "fullMatch": "[[Link Target#header|Title Text]]",
        "header": "header",
        "blockId": "",
        "targetName": "Link Target",
        "title": "Title Text",
        "isEmbed": false,
    },
    {
        "fullMatch": "[[Link Target]]",
        "header": "",
        "blockId": "",
        "targetName": "Link Target",
        "title": "Link Target",
        "isEmbed": false,
    },
    {
        "fullMatch": "[[Link Target#header]]",
        "header": "header",
        "blockId": "",
        "targetName": "Link Target",
        "title": "Link Target",
        "isEmbed": false,
    },
    {
        "fullMatch": "[[Link Target|Title Text]]",
        "header": "",
        "blockId": "",
        "targetName": "Link Target",
        "title": "Title Text",
        "isEmbed": false,
    }
    ],
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
        index: 226,
        length: 11,
        line: 14,
        parent: {
            content: "# Todo List",
            index: 213,
            length: 11,
            level: 1,
            line: 12,
            text: "Todo List",
        }
    }, {
        completed: true,
        content: "- [X] This is cool\n",
        indentLevel: 0,
        index: 238,
        length: 18,
        line: 15,
        parent: {
            content: "# Todo List",
            index: 213,
            length: 11,
            level: 1,
            line: 12,
            text: "Todo List",
        }
    }, {
        completed: false,
        content: "    - [ ] This is a child task\n",
        indentLevel: 2,
        index: 257,
        length: 30,
        line: 16,
        parent: {
            completed: true,
            content: "- [X] This is cool\n",
            indentLevel: 0,
            index: 238,
            length: 18,
            line: 15,
            parent: {
                content: "# Todo List",
                index: 213,
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
        index: 316,
        length: 11,
        line: 20,
        parent: {
            content: "# Multiple lists per note",
            index: 289,
            length: 25,
            level: 1,
            line: 18,
            text: "Multiple lists per note",
        }
    }]
};
