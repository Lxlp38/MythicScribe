import { exec } from 'child_process';
import * as vscode from 'vscode';

export const removeBracketsTextListener = vscode.window.onDidChangeTextEditorSelection(event => {    
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const position = editor.selection.active; 

    const rangeBeforeCursor = new vscode.Range(position.translate(0, -2), position);
    const textBeforeCursor = document.getText(rangeBeforeCursor);

    if (textBeforeCursor === '{}') {
        editor.edit(editBuilder => {
            editBuilder.delete(rangeBeforeCursor);
            editBuilder.insert(position.translate(0, -2), ' ');
        }).then(() => {
            vscode.commands.executeCommand('editor.action.triggerSuggest');
        });
    }
});
