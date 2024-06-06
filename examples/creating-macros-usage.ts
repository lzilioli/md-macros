import {replaceMacrosInMd, MacroMethod} from '@lzilioli/md-macros';

export async function creatingMacrosUsageExample(): Promise<void> {
    const macros: {[key: string]: MacroMethod} = {
        hello: async  (): Promise<string> => {
            return Promise.resolve('hello');
        },
        world: async (_args: unknown, mdText: string): Promise<string> => {
            // this example shows that mdText (the original text) is passed as
            // the second argument to the macro
            console.log(mdText);
            /*
                [[macro:greeting greeting="Hello" name="User"]]
                    [[macro:hello]] [[macro:world]]
             */
            return Promise.resolve('world');
        },
        greeting: (args: {name: string; greeting: string}): Promise<string> => {
            // A more complex macro that takes arguments
            // it is a good idea to validate the args here
            if (!args.name) {
                throw new Error('no name specified');
            }
            if (!args.greeting) {
                throw new Error('no greeting specified');
            }
            return Promise.resolve(`${args.greeting}, ${args.name}:`);
        }
    }

    const md: string = `[[macro:greeting greeting="Hello" name="User"]]
    [[macro:hello]] [[macro:world]]`;

    await replaceMacrosInMd(md, macros)
    .then((rendered: string) => {
        console.log(rendered === `Hello, User:
    hello world`); // true
        console.log(rendered);
        /*
            Hello User:
                hello world
        */
    });
}

