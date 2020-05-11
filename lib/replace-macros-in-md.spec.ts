import { replaceMacrosInMd } from "lib/replace-macros-in-md";
import { MacroMethod } from "lib/typedefs";
import {youtube} from 'lib/macros';

const md: string = `
test string [[youtube url="//www.youtube.com/embed/mnHrOBFlbdU"]]
test string [[youtube
	url="//www.youtube.com/embed/mnHrOBFlbdU"
	arg1="val1"
]]
`;

const macros: {[key: string]: MacroMethod} = {
	youtube
}

export async function test(): Promise<void> {
	describe( 'replaceMacrosInMd', () => {
        it('does a thing', () => {
            console.log(replaceMacrosInMd(md, macros));
        });
	} );
}
