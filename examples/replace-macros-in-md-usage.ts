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
}
