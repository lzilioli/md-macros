import * as remark from 'remark';
import * as toc from 'remark-toc';
import { MacroMethod } from './entries/typedefs';
import { replaceMacrosInMd } from './replace-macros-in-md';
import * as fs from 'fs';
import * as util from 'util';

const readFileAsync: (path: string) => Promise<Buffer> = util.promisify(fs.readFile);

/**
 * Requires `url` argument. Returns a rendered iframe with args.url
 * as the src and reasonable height/width/fullscreen/border defaults
 * for youtube video embeds.
 */
export const youtube: MacroMethod = (args: {url: string}): Promise<string> => {
    if (!args.url) {
        throw new Error('youtube macro requires url argument');
    }
    return Promise.resolve(`<iframe
width="560"
height="315"
src="${args.url}"
frameborder="0"
allowfullscreen
></iframe>`);
}

export const mdToc: MacroMethod = (_args: {}, mdText: string): Promise<string> => {
    return new Promise((yep: (result: string) => void, nope: (e: Error) => void) => {
        replaceMacrosInMd(mdText, {
            mdToc: () => Promise.resolve('# Table Of Contents\n\n# Table Of Contents End')
        }, ['!mdToc'])
        .then((modifiedMdText: string) => {
            remark()
            .use(toc)
            .process(modifiedMdText, (err: Error, file: unknown) => {
                if (err) {
                    nope(err);
                    return;
                }
                const contents: string = (file as {contents: string}).contents;
                const TOC_REGEX: RegExp = /(# Table Of Contents(?:[\s\S](?!# Table Of Contents End))*)\n# Table Of Contents End/;
                const match: RegExpMatchArray = contents.match(TOC_REGEX);
                if (!match) {
                    throw new Error('TOC could not be found');
                }
                yep(match[1].replace(`-   [Table Of Contents End](#table-of-contents-end)\n\n`, '').trim());
            });
        });
    });
}

export const inlineFile: MacroMethod = async(args: {path: string}): Promise<string> => {
    if (!args.path) {
        throw new Error(`inlineFile macro requires path argument`)
    }
    return await (await readFileAsync(args.path)).toString().trim();
}
