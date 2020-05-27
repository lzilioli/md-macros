import {parseMacrosFromMd, Macro} from '@lzilioli/md-macros';

export async function parseMacrosFromMdUsageExample(): Promise<void> {
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
}
