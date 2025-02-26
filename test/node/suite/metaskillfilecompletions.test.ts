import * as assert from 'assert';
import path from 'path';

import * as vscode from 'vscode';

import { getDocumentLastPosition, waitForMythicScript } from '..';
import { MetaskillFileObjects } from '../../../src/common/schemas/metaskillFileObjects';

suite('Metaskill File Completions', () => {
    setup(async () => {
        const uri = vscode.Uri.file(
            path.resolve(__dirname, '../../../test/fixtures/mythicmobs/skills/testskill.yml')
        );
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
        await waitForMythicScript(document);
    });

    suite('Completions Checker', () => {
        let completions: vscode.CompletionList | undefined;
        const editor = vscode.window.activeTextEditor;

        test('Should provide completions for MythicScript', async () => {
            const position = new vscode.Position(0, 0);
            completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                vscode.window.activeTextEditor?.document.uri,
                position
            );
            assert.ok(completions);
            assert.ok(completions.items.length > 0);
        });

        test('Should provide correct completions for metaskill files', async () => {
            if (editor) {
                await editor.edit((editBuilder) => {
                    editBuilder.insert(getDocumentLastPosition(editor.document), '\ntestskill:\n');
                });

                completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                    'vscode.executeCompletionItemProvider',
                    editor.document.uri,
                    getDocumentLastPosition(editor.document)
                );

                assert.ok(completions);
                const expectedCompletions = Object.keys(MetaskillFileObjects);
                const actualCompletions = completions.items.map((item) => item.label);
                assert.deepStrictEqual(actualCompletions.sort(), expectedCompletions.sort());
            }
        });
    });
});
