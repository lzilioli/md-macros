/**
 * Requires `url` argument. Returns a rendered iframe with args.url
 * as the src and reasonable height/width/fullscreen/border defaults
 * for youtube video embeds.
 */
export const youtube = (args: {url: string}): string => {
    if (!args.url) {
        throw new Error('youtube macro requires url argument');
    }
    return `<iframe
width="560"
height="315"
src="${args.url}"
frameborder="0"
allowfullscreen
></iframe>`;
}
