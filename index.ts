import { replaceMacrosInMd as replace } from 'lib/replace-macros-in-md';
import { parseMacrosFromMd as parse } from "lib/parse-macros-from-md";
import * as bundledMacros from 'lib/macros';
import { MacroMethod as mm, Macro as m } from 'lib/typedefs';

export type MacroMethod = mm;
export type Macro = m;
export const replaceMacrosInMd: (md: string, macros: {[key: string]: mm}) => string = replace;
export const parseMacrosFromMd: (md: string) => m[] = parse;
export const macros: {[key: string]: mm} = bundledMacros;
