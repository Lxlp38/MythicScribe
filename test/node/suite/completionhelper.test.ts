import assert from 'assert';

import * as vscode from 'vscode';

import {
    checkShouldKeyComplete,
    checkShouldPrefixComplete,
    getListCompletionNeededSpaces,
} from '../../../src/common/schemas/resolution/helpers';
import { generateFileCompletion } from '../../../src/common/schemas/resolution/schemaResolution';
import { getStubDocument } from '..';
import { addMechanicCompletions, MythicAttribute, MythicMechanic } from '../../../src/common/datasets/ScribeMechanic';
import { Schema, SchemaElementTypes } from '../../../src/common/objectInfos';
import { retriggerCompletionsCommand } from '../../../src/common/constants';

suite('CompletionHelper', () => {
    suite('getListCompletionNeededSpaces', () => {
        let document: vscode.TextDocument;
        let context: vscode.CompletionContext;

        setup(() => {
            document = getStubDocument(['']);
            context = {
                triggerKind: vscode.CompletionTriggerKind.Invoke,
            } as vscode.CompletionContext;
        });

        test('should return undefined if line matches regex', () => {
            document = getStubDocument(['  - item ']);
            const result = getListCompletionNeededSpaces(
                document,
                new vscode.Position(0, 5),
                context
            );
            assert.strictEqual(result, undefined);
        });

        test('should return undefined if previous special symbol is not "-"', () => {
            document = getStubDocument(['  item ']);
            const result = getListCompletionNeededSpaces(
                document,
                new vscode.Position(0, 5),
                context
            );
            assert.strictEqual(result, undefined);
        });

        test('should return undefined if char before position is not "- "', () => {
            document = getStubDocument(['  item ']);
            context = { ...context, triggerCharacter: ' ' };
            const result = getListCompletionNeededSpaces(
                document,
                new vscode.Position(0, 5),
                context
            );
            assert.strictEqual(result, undefined);
        });

        test('should return empty string if trigger character is space', () => {
            document = getStubDocument(['  - ']);
            const newContext = {
                ...context,
                triggerKind: vscode.CompletionTriggerKind.TriggerCharacter,
                triggerCharacter: ' ',
            };
            const result = getListCompletionNeededSpaces(
                document,
                new vscode.Position(0, 4),
                newContext
            );
            assert.strictEqual(result, '');
        });

        test('should return space if char before position is "-"', () => {
            document = getStubDocument(['  -']);
            const newContext = { ...context, triggerCharacter: undefined };
            const result = getListCompletionNeededSpaces(
                document,
                new vscode.Position(0, 3),
                newContext
            );
            assert.strictEqual(result, ' ');
        });

        test('should return empty string if char before position is not "-"', () => {
            document = getStubDocument(['  - ']);
            const newContext = {
                ...context,
                triggerCharacter: undefined,
            };
            const result = getListCompletionNeededSpaces(
                document,
                new vscode.Position(0, 4),
                newContext
            );
            assert.strictEqual(result, '');
        });
    });
    suite('checkShouldComplete', () => {
        let document: vscode.TextDocument;
        const keylist = ['key1', 'key2'];
        const symbols = ['^', '+'];

        setup(() => {
            document = getStubDocument(['']);
        });

        suite('checkShouldKeyComplete', () => {
            test('should return false if position is after comment', () => {
                document = getStubDocument(['key1:', '  #comment']);
                const result = checkShouldKeyComplete(document, new vscode.Position(1, 4), keylist);
                assert.strictEqual(result, false);
            });

            test('should return true if key is in keylist', () => {
                document = getStubDocument(['identifier:', '  key1:', '  - hello']);
                const result = checkShouldKeyComplete(document, new vscode.Position(2, 1), keylist);
                assert.strictEqual(result, true);
            });

            test('should return false if key is not in keylist', () => {
                document = getStubDocument(['identifier:', '  key3:', '  - hello']);
                const result = checkShouldKeyComplete(document, new vscode.Position(2, 1), keylist);
                assert.strictEqual(result, false);
            });
        });
        suite('checkShouldPrefixComplete', () => {
            let context: vscode.CompletionContext;

            setup(() => {
                context = {
                    triggerKind: vscode.CompletionTriggerKind.Invoke,
                } as vscode.CompletionContext;
            });

            test('should return false if position is after comment', () => {
                document = getStubDocument(['key1:', '  #comment']);
                const result = checkShouldPrefixComplete(
                    document,
                    new vscode.Position(1, 4),
                    context,
                    symbols
                );
                assert.strictEqual(result, false);
            });

            test('should return true if previous symbol is in symbols list', () => {
                document = getStubDocument(['key1:', '  ^ value']);
                const result = checkShouldPrefixComplete(
                    document,
                    new vscode.Position(1, 3),
                    context,
                    symbols
                );
                assert.strictEqual(result, true);
            });

            test('should return false if previous symbol is not in symbols list', () => {
                document = getStubDocument(['key1:', '  value']);
                const result = checkShouldPrefixComplete(
                    document,
                    new vscode.Position(1, 3),
                    context,
                    symbols
                );
                assert.strictEqual(result, false);
            });

            test('should return true if char before position is in symbols list', () => {
                document = getStubDocument(['key1:', '  ^ value']);
                context = {
                    ...context,
                    triggerKind: vscode.CompletionTriggerKind.TriggerCharacter,
                };
                const result = checkShouldPrefixComplete(
                    document,
                    new vscode.Position(1, 3),
                    context,
                    symbols
                );
                assert.strictEqual(result, true);
            });

            test('should return false if char before position is not in symbols list', () => {
                document = getStubDocument(['key1:', '  value']);
                context = {
                    ...context,
                    triggerKind: vscode.CompletionTriggerKind.TriggerCharacter,
                };
                const result = checkShouldPrefixComplete(
                    document,
                    new vscode.Position(1, 3),
                    context,
                    symbols
                );
                assert.strictEqual(result, false);
            });
        });
    });
    suite('addMechanicCompletions', () => {
        let target: MythicMechanic[];
        let attribute: MythicAttribute;
        let completionItems: vscode.CompletionItem[];

        setup(() => {
            attribute = {
                name: 'attribute1',
                description: 'Test attribute',
                type: 'Boolean',
            } as unknown as MythicAttribute;
            target = [
                {
                    name: ['mechanic1', 'mechanic2'],
                    description: 'Test mechanic',
                    myAttributes: [attribute],
                    getMyAttributes: () => [attribute],
                },
            ] as unknown as MythicMechanic[];
            completionItems = [];
        });

        test('should add completion items for each mechanic name', () => {
            addMechanicCompletions(target, completionItems);
            assert.strictEqual(completionItems.length, 2);
            assert.strictEqual(completionItems[0].label, 'mechanic1');
            assert.strictEqual(completionItems[1].label, 'mechanic2');
        });

        test('should set correct details for completion items', () => {
            addMechanicCompletions(target, completionItems);
            assert.strictEqual(completionItems[0].detail, 'Test mechanic');
            assert.strictEqual(completionItems[1].detail, 'Test mechanic');
        });

        test('should set correct kind for completion items', () => {
            addMechanicCompletions(target, completionItems);
            assert.strictEqual(completionItems[0].kind, vscode.CompletionItemKind.Function);
            assert.strictEqual(completionItems[1].kind, vscode.CompletionItemKind.Function);
        });

        test('should set correct insert text for completion items', () => {
            addMechanicCompletions(target, completionItems);
            assert.strictEqual(
                (completionItems[0].insertText as vscode.SnippetString)?.value,
                'mechanic1{$0}'
            );
            assert.strictEqual(
                (completionItems[1].insertText as vscode.SnippetString)?.value,
                'mechanic2{$0}'
            );
        });

        test('should set correct command for completion items', () => {
            addMechanicCompletions(target, completionItems);
            assert.strictEqual(completionItems[0].command, retriggerCompletionsCommand);
            assert.strictEqual(completionItems[1].command, retriggerCompletionsCommand);
        });

        test('should do a simple completion if no attributes are found', () => {
            target[0].getMyAttributes = () => [];
            addMechanicCompletions(target, completionItems);
            assert.strictEqual(completionItems.length, 2);
            assert.strictEqual(completionItems[0].label, 'mechanic1');
            assert.strictEqual(completionItems[1].label, 'mechanic2');
            }
        );
    });
    suite('fileCompletions', () => {
        let document: vscode.TextDocument;
        let position: vscode.Position;
        let objectmap: Schema;

        setup(() => {
            document = getStubDocument(['']);
            position = new vscode.Position(0, 0);
            objectmap = {
                key1: {
                    type: SchemaElementTypes.KEY,
                    keys: {
                        subkey1: {
                            type: SchemaElementTypes.LIST,
                            description: 'Subkey 1 description',
                        },
                    },
                },
            };
        });
    });
});
