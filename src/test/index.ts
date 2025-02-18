/* eslint-disable no-console */
import * as path from 'path';

import { globSync } from 'glob'; // Use globSync for synchronous file matching
import Mocha from 'mocha';
import * as vscode from 'vscode';
import * as sinon from 'sinon';

export function run(): Promise<void> {
    // Create the Mocha test runner
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
    });

    // Set the timeout for tests (optional)
    mocha.timeout(10000);

    // Get the path to the test files
    const testsRoot = path.resolve(__dirname, '../test/suite');
    // Log every file in the testsRoot directory

    // Find all test files using globSync
    const files = globSync('**/*.test.js', { cwd: testsRoot });

    // Add each test file to Mocha
    files.forEach((file) => {
        mocha.addFile(path.resolve(testsRoot, file));
    });

    // Return a promise to run the tests
    return new Promise((resolve, reject) => {
        try {
            // Run the tests
            mocha.run((failures) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
}

export async function waitForMythicScript(document: vscode.TextDocument) {
    for (let i = 0; i < 100; i++) {
        if (document.languageId === 'mythicscript') {
            break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
}

export function getDocumentLastPosition(document: vscode.TextDocument) {
    return document.positionAt(document.getText().length);
}

export function getStubDocument(text: string[]) {
    return {
        getText: sinon.stub().callsFake((range?: vscode.Range) => {
            if (!range) {
                return text.join('\n');
            }
            return text
                .slice(range.start.line, range.end.line + 1)
                .join('\n')
                .substring(
                    range.start.character,
                    range.end.character + range.end.line - range.start.line
                );
        }),
        lineAt: sinon.stub().callsFake((line) => {
            return {
                text: text[line],
            };
        }),
        uri: {} as vscode.Uri,
        fileName: '',
        isUntitled: false,
        languageId: '',
        version: 1,
        isDirty: false,
        isClosed: false,
        save: sinon.stub().resolves(true),
        eol: vscode.EndOfLine.LF,
        lineCount: text.length,
    } as unknown as vscode.TextDocument;
}
