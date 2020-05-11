import {replaceMacrosInMd} from 'lib/replace-macros-in-md';
import { parseMacrosFromMd } from "lib/parse-macros-from-md";
import { youtube } from 'lib/macros';
import { MacroMethod } from 'lib/typedefs';

const macros: {[key: string]: MacroMethod} = {youtube};
const md: string = `
test string [[youtube url="//www.youtube.com/embed/mnHrOBFlbdU"]]
test string [[youtube
	url="//www.youtube.com/embed/mnHrOBFlbdU"
	arg1="val1"
]]
`;

console.log(parseMacrosFromMd(md));
console.log(replaceMacrosInMd(md, macros));
