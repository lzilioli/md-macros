import * as _ from 'lodash';
import { Macro, MacroMethod } from '@lib/entries/typedefs';
import { parseMacrosFromMd } from '@lib/parse-macros-from-md';

export async function replaceMacrosInMd(md: string, macros: {[key: string]: MacroMethod}): Promise<string> {
	// Parse all macros out of the markdown string
	const parsedMacros: Macro[] = parseMacrosFromMd(md);

	// Make sure all of the macros in the md string are defined as
	// functions in our macros argument
	_.each(parsedMacros, (macro: Macro) => {
		if (!macros[macro.name]) {
			throw new Error(`md string contained macro ${macro.name}, but no such macro was passed`);
		}
		if (!_.isFunction(macros[macro.name])) {
			throw new Error(`macro ${macro.name} is not a function`);
		}
	})

	// Execute each macro with its arguments, and replace its original
	// reference in newString with its return value
	let newString: string = md;
	for(let i: number = 0; i < parsedMacros.length; i++) {
		const macro: Macro = parsedMacros[i];
		const method: MacroMethod = macros[macro.name];
		const macroResults: string = await method(macro.args, md);
		newString = newString.replace(macro.fullMatch, macroResults);
	}

	// Return the new string, with all macros having been executed
	return newString;
}
