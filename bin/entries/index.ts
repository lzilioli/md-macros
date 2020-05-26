import * as fs from 'fs';
import * as util from 'util';
import {replaceMacrosInMd} from '@lib/replace-macros-in-md';
import * as macros from '@lib/macros';

const readFileAsync: (path: string) => Promise<Buffer> = util.promisify(fs.readFile);
const writeFileAsync: (path: string, contents: string) => Promise<void> = util.promisify(fs.writeFile);

if (process.argv.length !== 4) {
    console.log(`Usage:\n\tmdtoc </path/to/input.tmpl.md> </path/to/output.md>`)
    process.exit(1);
}

console.log('mdmacros: reading from', process.argv[2]);
readFileAsync(process.argv[2])
.then((contents: Buffer) => {
    return replaceMacrosInMd(contents.toString(), {
        mdToc: macros.mdToc,
    }, ['!mdToc']);
})
.then((contents: string) => {
    return replaceMacrosInMd(contents.toString(), {
        inlineFile: macros.inlineFile,
    }, ['!inlineFile']);
})
.then((final: string) => {
    console.log('mdmacros: writing to', process.argv[3]);
    return writeFileAsync(process.argv[3], final);
});
