import * as assert from 'assert';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as path from 'path';

import * as vscode from 'vscode';

import { checkFileEnabled } from '../../../src/common/utils/configutils';
import { waitForMythicScript } from '..';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    const extension = vscode.extensions.getExtension('Lxlp.mythicscribe')!;

    test('Extension should be present', () => {
        assert.ok(extension);
    });

    test('Extension should be activated', async () => {
        await extension.activate();
        assert.ok(extension.isActive);
    });

    test('Extension should provide MythicScript syntax highlighting', async () => {
        const uri = vscode.Uri.file(
            path.resolve(__dirname, '../../../test/fixtures/mythicmobs/skills/testskill.yml')
        );
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);

        await waitForMythicScript(document);
        assert.strictEqual(
            document.languageId,
            'mythicscript',
            'Document language should be MythicScript'
        );
        assert.strictEqual(
            checkFileEnabled(document, 'Metaskill'),
            true,
            'The opened file should be recognized as a skill file'
        );
    });

    test('Extension should provide completions for MythicScript', async () => {
        const uri = vscode.Uri.file(
            path.resolve(__dirname, '../../../test/fixtures/mythicmobs/skills/testskill.yml')
        );
        const document = await vscode.workspace.openTextDocument(uri);

        const position = new vscode.Position(0, 0);
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            document.uri,
            position
        );

        assert.ok(completions, 'Completion list should be provided');
        assert.ok(completions.items.length > 0, 'Completion list should not be empty');
    });
});
