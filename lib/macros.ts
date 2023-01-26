import { parseHeadersFromMd } from '@lib/parse-macros-from-md';
import { replaceMacrosInMd } from '@lib/replace-macros-in-md';
import { MacroMethod, ParsedHeader } from '@lib/typedefs';
import * as fs from 'fs';
import { constant, kebabCase, times } from 'lodash';
import * as util from 'util';
const readFileAsync: (path: string) => Promise<Buffer> = util.promisify(fs.readFile);
const fileExistsAsync: (path: string) => Promise<boolean> = util.promisify(fs.exists);

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

export const mdToc: MacroMethod = async (_args: never, mdText: string): Promise<string> => {
    const modifiedMdText: string = await replaceMacrosInMd(mdText, {
        mdToc: () => Promise.resolve('TABLE_OF_CONTENTS_GOES_HERE')
    }, ['!mdToc']);
    const headers: ParsedHeader[] = parseHeadersFromMd(modifiedMdText);
    const toc: string = headers.map((header: ParsedHeader): string => {
        return `${times(header.level - 1, constant('    ')).join('')}-   [${header.text}](#${kebabCase(header.text)})`;
    }).join('\n');
    const tocText: string = `# Table of Contents

${toc}`;
    return tocText;
}

export const inlineFile: MacroMethod = async(args: {path: string}): Promise<string> => {
    if (!args.path) {
        throw new Error(`inlineFile macro requires path argument`)
    }
    const exists: boolean = await fileExistsAsync(args.path);
    if (!exists) {
        throw new Error(`File not found: ${args.path}`);
    }
    return await (await readFileAsync(args.path)).toString().trim();
}
