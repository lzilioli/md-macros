import * as _ from 'lodash';

function requireAll( requireContext: __WebpackModuleApi.RequireContext ): TestingModule[] {
	return requireContext.keys().map( (k: string) => requireContext(k)) as TestingModule[];
}

type TestingFunction = () => Promise<void>;

interface TestingModule {
    test: TestingFunction;
}

const testsContext: __WebpackModuleApi.RequireContext = require.context( `../../lib`, true, /^.*\.spec\.ts$/ );
const testsContext2: __WebpackModuleApi.RequireContext = require.context( `../../tests`, true, /^.*\.spec\.ts$/ );
const modules: TestingModule[] = [
    ...requireAll( testsContext ),
    ...requireAll( testsContext2 ),
];

async function runTests(): Promise<void> {
    for(let i: number = 0; i < modules.length; i++) {
        const test: TestingModule = modules[i];
        if (_.isFunction(test.test)) {
            await test.test();
        } else {
            throw new Error('file named with .spec.ts must export async test function that executes the tests');
        }
    }
}

runTests();
