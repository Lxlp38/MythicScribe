import * as assert from 'assert';

import * as vscode from 'vscode';
import * as sinon from 'sinon';

import {
    getParentKeys,
    getWordBeforePosition,
    getMechanicLine,
    previousSymbol,
    isAfterComment,
    isEmptyLine,
    PreviousSymbolRegexes
} from '../../../src/common/utils/yamlutils';


suite('YAML Utils', () => {
    let document: vscode.TextDocument;
    let position: vscode.Position;
    let lines: string[];

    setup(() => {
        lines = [
            'root:',
            '  parent1:',
            '    child1: value1',
            '    child2: value2',
            '  parent2:',
            '    child3: value3',
        ];
        document = {
            getText: sinon.stub(),
            lineAt: sinon.stub(),
            uri: {} as vscode.Uri,
            fileName: '',
            isUntitled: false,
            languageId: '',
            version: 1,
            isDirty: false,
            isClosed: false,
            save: sinon.stub().resolves(true),
            eol: vscode.EndOfLine.LF,
            lineCount: lines.length,
        } as unknown as vscode.TextDocument;
    });

    suite('getParentKeys', () => {
        const parentKeysMap = [
            {
                key: 'parent1',
                line: 1,
                indent: 2,
            },
            {
                key: 'root',
                line: 0,
                indent: 0,
            },
        ]    
        test('getParentKeys should return parent keys correctly', () => {
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(2, 0); // Position at 'child1: value1'
            const keys = getParentKeys(document, position);
            assert.deepStrictEqual(keys, parentKeysMap);
        });

        test('getParentKeys should include current line key if getLineKey is true', () => {
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(2, 0); // Position at 'child1: value1'
            const keys = getParentKeys(document, position, true);
            assert.deepStrictEqual(keys, [
                {
                    key: 'child1',
                    line: 2,
                    indent: 4,
                }, ...parentKeysMap
            ]);
        });

        test('getParentKeys should return empty array if no parent keys are found', () => {
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(0, 0); // Position at 'root:'
            const keys = getParentKeys(document, position);
            assert.deepStrictEqual(keys, []);
        });

        test('getParentKeys should handle empty document', () => {
            const lines: string[] = [];

            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index] || '',
            }));

            position = new vscode.Position(0, 0); // Position at the start of an empty document
            const keys = getParentKeys(document, position);
            assert.deepStrictEqual(keys, []);
        });
    });

    suite('getWordBeforePosition', () => {
        test('getWordBeforePosition should return the word before the given position', () => {
            lines = ['root: value', '  parent1: value1', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 10); // Position after 'parent1:'
            const word = getWordBeforePosition(document, position);
            assert.strictEqual(word, 'parent1:');
        });

        test('getWordBeforePosition should return empty string if no word is found', () => {
            lines = ['root: value', '  parent1: value1', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 0); // Position at the start of the line
            const word = getWordBeforePosition(document, position);
            assert.strictEqual(word, '');
        });

        test('getWordBeforePosition should handle lines with multiple spaces', () => {
            lines = ['root: value', '  parent1:    value1', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 12); // Position after 'parent1:'
            const word = getWordBeforePosition(document, position);
            assert.strictEqual(word, 'parent1:');
        });
    });

    suite('getMechanicLine', () => {
        test('getMechanicLine should parse mechanic line correctly', () => {
            lines = ['- mechanic @targeter ~trigger ?condition'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            const mechanicMap = getMechanicLine(document, 0);
            assert.strictEqual(mechanicMap.get('mechanic'), 'mechanic');
            assert.strictEqual(mechanicMap.get('targeter'), '@targeter');
            assert.strictEqual(mechanicMap.get('trigger'), '~trigger');
            assert.strictEqual(mechanicMap.get('conditions'), '?condition');
        });

        test('getMechanicLine should handle line without targeter, trigger, and conditions', () => {
            lines = ['- mechanic'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            const mechanicMap = getMechanicLine(document, 0);
            assert.strictEqual(mechanicMap.get('mechanic'), 'mechanic');
            assert.strictEqual(mechanicMap.get('targeter'), undefined);
            assert.strictEqual(mechanicMap.get('trigger'), undefined);
            assert.strictEqual(mechanicMap.get('conditions'), undefined);
        });

        test('getMechanicLine should handle line with only mechanic and targeter', () => {
            lines = ['- mechanic @targeter'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            const mechanicMap = getMechanicLine(document, 0);
            assert.strictEqual(mechanicMap.get('mechanic'), 'mechanic');
            assert.strictEqual(mechanicMap.get('targeter'), '@targeter');
            assert.strictEqual(mechanicMap.get('trigger'), undefined);
            assert.strictEqual(mechanicMap.get('conditions'), undefined);
        });

        test('getMechanicLine should handle line with mechanic, targeter, and trigger', () => {
            lines = ['- mechanic @targeter ~trigger'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            const mechanicMap = getMechanicLine(document, 0);
            assert.strictEqual(mechanicMap.get('mechanic'), 'mechanic');
            assert.strictEqual(mechanicMap.get('targeter'), '@targeter');
            assert.strictEqual(mechanicMap.get('trigger'), '~trigger');
            assert.strictEqual(mechanicMap.get('conditions'), undefined);
        });

        test('getMechanicLine should handle line with mechanic and conditions', () => {
            lines = ['- mechanic ?condition'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            const mechanicMap = getMechanicLine(document, 0);
            assert.strictEqual(mechanicMap.get('mechanic'), 'mechanic');
            assert.strictEqual(mechanicMap.get('targeter'), undefined);
            assert.strictEqual(mechanicMap.get('trigger'), undefined);
            assert.strictEqual(mechanicMap.get('conditions'), '?condition');
        });
    });

    suite('previousSpecialSymbol', () => {
        test('previousSpecialSymbol should return the previous special symbol', () => {
            lines = ['root: value', '  - parent1: value1', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 12); // Position after 'parent1:'
            const symbol = previousSymbol(PreviousSymbolRegexes.nonspace, document, position);
            assert.strictEqual(symbol, '-');
        });

        test('previousSpecialSymbol should return empty string if no special symbol is found', () => {
            lines = ['root: value', '  parent1: value1', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 10); // Position after 'parent1'
            const symbol = previousSymbol(PreviousSymbolRegexes.nonspace, document, position);
            assert.strictEqual(symbol, '');
        });

        test('previousSpecialSymbol should handle lines with multiple special symbols', () => {
            lines = ['root: value', '  parent1: value1', '    child1-+: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(2, 14); // Position after 'child1-+:'
            const symbol = previousSymbol(PreviousSymbolRegexes.nonspace, document, position);
            assert.strictEqual(symbol, '+');
        });

        test('previousSpecialSymbol should handle empty lines', () => {
            lines = ['root: value', '', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 0); // Position at the start of an empty line
            const symbol = previousSymbol(PreviousSymbolRegexes.nonspace, document, position);
            assert.strictEqual(symbol, '');
        });
    });
    suite('previousSymbol', () => {
        test('previousSymbol should return the previous non-word character', () => {
            lines = ['root: value', '  - parent1: value1', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 12); // Position after 'parent1:'
            const symbol = previousSymbol(PreviousSymbolRegexes.default, document, position);
            assert.strictEqual(symbol, ' ');
        });

        test('previousSymbol should return empty string if no non-word character is found', () => {
            lines = ['root: value', '  parent1: value1', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 10); // Position after 'parent1'
            const symbol = previousSymbol(PreviousSymbolRegexes.default, document, position);
            assert.strictEqual(symbol, ' ');
        });

        test('previousSymbol should handle lines with multiple non-word characters', () => {
            lines = ['root: value', '  parent1: value1', '    child1-+: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(2, 13); // Position after 'child1-+:'
            const symbol = previousSymbol(PreviousSymbolRegexes.default, document, position);
            assert.strictEqual(symbol, '+');
        });

        test('previousSymbol should handle empty lines', () => {
            lines = ['root: value', '', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 0); // Position at the start of an empty line
            const symbol = previousSymbol(PreviousSymbolRegexes.default, document, position);
            assert.strictEqual(symbol, '');
        });
    });
    suite('isAfterComment', () => {
        test('isAfterComment should return true if position is after a comment', () => {
            lines = ['root: value', '  parent1: value1 # comment', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 25); // Position after 'value1 # comment'
            const result = isAfterComment(document, position);
            assert.strictEqual(result, true);
        });

        test('isAfterComment should return false if position is before a comment', () => {
            lines = ['root: value', '  parent1: value1 # comment', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 15); // Position before '# comment'
            const result = isAfterComment(document, position);
            assert.strictEqual(result, false);
        });

        test('isAfterComment should return false if there is no comment on the line', () => {
            lines = ['root: value', '  parent1: value1', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 15); // Position after 'value1'
            const result = isAfterComment(document, position);
            assert.strictEqual(result, false);
        });

        test('isAfterComment should handle empty lines', () => {
            lines = ['root: value', '', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 0); // Position at the start of an empty line
            const result = isAfterComment(document, position);
            assert.strictEqual(result, false);
        });

        test('isAfterComment should not consider a comment a # if it is after another non whitespace character', () => {
            lines = ['root: value', '  parent1: value1# comment', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            position = new vscode.Position(1, 25); // Position after 'value1 #comment'
            const result = isAfterComment(document, position);
            assert.strictEqual(result, false);
        });
    });
    suite('isEmptyLine', () => {
        test('isEmptyLine should return true for an empty line', () => {
            lines = ['root: value', '', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            const result = isEmptyLine(document, 1); // Check the empty line
            assert.strictEqual(result, true);
        });

        test('isEmptyLine should return true for a line with only whitespace', () => {
            lines = ['root: value', '    ', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            const result = isEmptyLine(document, 1); // Check the line with only whitespace
            assert.strictEqual(result, true);
        });

        test('isEmptyLine should return false for a line with text', () => {
            lines = ['root: value', '  parent1: value1', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            const result = isEmptyLine(document, 1); // Check the line with text
            assert.strictEqual(result, false);
        });

        test('isEmptyLine should handle the first line of the document', () => {
            lines = ['', '  parent1: value1', '    child1: value1'];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            const result = isEmptyLine(document, 0); // Check the first line
            assert.strictEqual(result, true);
        });

        test('isEmptyLine should handle the last line of the document', () => {
            lines = ['root: value', '  parent1: value1', ''];
            (document.lineAt as sinon.SinonStub).callsFake((index: number) => ({
                text: lines[index],
            }));

            const result = isEmptyLine(document, 2); // Check the last line
            assert.strictEqual(result, true);
        });
    });
});
