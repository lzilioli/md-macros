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
