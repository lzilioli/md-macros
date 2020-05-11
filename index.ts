import * as bundledMacros from 'lib/macros';
import { MacroMethod } from 'lib/typedefs';
export { parseMacrosFromMd } from "lib/parse-macros-from-md";
export { replaceMacrosInMd } from 'lib/replace-macros-in-md';
export const macros: {[key: string]: MacroMethod} = bundledMacros;
