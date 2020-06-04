import * as _ from 'lodash';
import * as minimatch from 'minimatch';
import { Macro, MacroMethod, ParsedMacros } from '@lib/typedefs';
import { parseMacrosFromMd } from '@lib/parse-macros-from-md';
import * as myMacros from '@lib/macros';

export async function replaceMacrosInMd(md: string, macros: {[key: string]: MacroMethod} = myMacros, skipMacroNamePatterns: string[] = []): Promise<string> {
	// Parse all macros out of the markdown string
	const parsedMacros: ParsedMacros = parseMacrosFromMd(md);
	const skippedMacros: string[] = [];

	// Make sure all of the macros in the md string are defined as
	// functions in our macros argument
	_.each(parsedMacros.custom, (macro: Macro) => {
		const skipThisMacro: boolean = _.some(skipMacroNamePatterns, (skipPattern: string) => {
			return minimatch(macro.name, skipPattern);
		});
		if (skipThisMacro) {
			skippedMacros.push(macro.name);
			return;
		}
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
	for(let i: number = 0; i < parsedMacros.custom.length; i++) {
		const macro: Macro = parsedMacros.custom[i];
		if (skippedMacros.indexOf(macro.name) !== -1) {
			continue;
		}
		const method: MacroMethod = macros[macro.name];
		const macroResults: string = await method(macro.args, md);
		newString = newString.replace(macro.fullMatch, macroResults);
	}

	// Return the new string, with all macros having been executed
	return newString;
}
