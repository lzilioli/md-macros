import { creatingMacrosUsageExample } from '@examples/creating-macros-usage';
import { parseMacrosFromMdUsageExample } from '@examples/parse-macros-from-md-usage';
import { replaceMacrosInMdUsageExample } from '@examples/replace-macros-in-md-usage';
import * as assert from 'assert';
import { EXPECTED_PARSED_MACROS } from './expected-parsed-macros';

export async function test(): Promise<void> {
    describe('examples', () => {
        let prevConsole: typeof console.log;
        let loggedOutput: unknown[];
        beforeEach(() => {
            loggedOutput = [];
            prevConsole = console.log;
            // eslint-disable-next-line
            console.log = (...output) => {
                loggedOutput.push(output);
            }
        });

        afterEach(() => {
            console.log = prevConsole;
        });

        describe('parseMacrosFromMdUsageExample', () => {
            it('runs', async () => {
                await parseMacrosFromMdUsageExample();
                assert.deepEqual(
                    loggedOutput,
                    [[EXPECTED_PARSED_MACROS]]
                );
            });
        });

        describe('creatingMacrosUsageExample', () => {
            it('runs', async () => {
                await creatingMacrosUsageExample();
                assert.deepEqual(
                    loggedOutput,
                    [
                        [`[[greeting greeting="Hello" name="User"]]
    [[hello]] [[world]]`],
                        [ true ],
                        [ `Hello, User:
    hello world` ]
                    ]
                    )
                });
            });

            describe('replaceMacrosInMd', () => {
                it('runs', async () => {
                    await replaceMacrosInMdUsageExample();
                    assert.deepEqual(
                        loggedOutput,
                        [
                            [`Hello <iframe\nwidth="560"\nheight="315"\nsrc="<youtube embed url>"\nframeborder="0"\nallowfullscreen\n></iframe>`],
                            [`Hello [[youtube url="<youtube embed url>"]]`]
                        ]
                        )
                    });
                });
            });
        }
