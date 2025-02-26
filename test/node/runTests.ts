/* eslint-disable no-console */
import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
    console.log('Running tests...');
    try {
        // The folder containing the extension's package.json
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

        // The path to the test runner script
        const extensionTestsPath = path.resolve(__dirname, './index');
        console.log(extensionDevelopmentPath, extensionTestsPath);
        // Run the tests
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();
