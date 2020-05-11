// import assert from 'assert';
import { parseMacrosFromMd } from "lib/parse-macros-from-md";


const md: string = `
test string [[youtube url="//www.youtube.com/embed/mnHrOBFlbdU"]]
test string [[youtube
	url="//www.youtube.com/embed/mnHrOBFlbdU"
	arg1="val1"
]]
`;

export async function test(): Promise<void> {
	describe( 'parseMacrosFromMd', () => {
        it('does a thing', () => {
            console.log(parseMacrosFromMd(md));
        });
	} );
}
