import {replaceMacrosInMd} from 'md-macros';
import {MacroMethod} from 'md-macros/dist/typedefs';

const macros: {[key: string]: MacroMethod} = {
    hello: async  (): Promise<string> => {
        return Promise.resolve('hello');
    },
    world: async (): Promise<string> => {
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


const md: string = `[[greeting greeting="Hello" name="User"]]
    [[hello]] [[world]]`;

replaceMacrosInMd(md, macros)
.then((rendered: string) => {
    console.log(rendered === `Hello, User:\n\thello world`); // true
    console.log(rendered);
    /*
        Hello User:
            hello world
    */
});

