import {parseMacrosFromMd, ParsedMacros} from '@lzilioli/md-macros';

export async function parseMacrosFromMdUsageExample(): Promise<void> {
    const md: string = `
        Hello [[youtube url="<youtube embed url>"]] ![alt text](www.example.com/example.png "Title Text")
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
            links: []s,
        }
    */
}
