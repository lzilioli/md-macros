export type MacroMethod = (args: unknown) => string;

export interface Macro {
	name: string;
	args: unknown;
	fullMatch: string;
}
