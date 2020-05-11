import * as _ from 'lodash';
import { Macro, MacroMethod } from 'lib/typedefs';
import { parseMacrosFromMd } from 'lib/parse-macros-from-md';

export function replaceMacrosInMd(md: string, macros: {[key: string]: (args: unknown) => string}): string {
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
	_.each(parsedMacros, (macro: Macro) => {
		const method: MacroMethod = macros[macro.name];
		const macroResults: string = method(macro.args);
		newString = newString.replace(macro.fullMatch, macroResults);
	});

	// Return the new string, with all macros having been executed
	return newString;
}
