import * as _ from 'lodash';

function requireAll( requireContext: __WebpackModuleApi.RequireContext ): TestingModule[] {
	return requireContext.keys().map( requireContext ) as TestingModule[];
}

type TestingFunction = () => Promise<void>;

interface TestingModule {
    test: TestingFunction;
}

const testsContext: __WebpackModuleApi.RequireContext = require.context( `lib/`, false, /^.*\.spec\.ts$/ );
const modules: TestingModule[] = requireAll( testsContext );

async function runTests(): Promise<void> {
    for(let i: number = 0; i < modules.length; i++) {
        const test: TestingModule = modules[i];
        if (_.isFunction(test.test)) {
            await test.test();
        } else {
            throw new Error('no compatible export found');
        }
    }
}

runTests();
