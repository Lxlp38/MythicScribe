import * as vscode from 'vscode';
import { isEnabled } from '../utils/configutils';

let lastexecutiontime = 0

export function removeBracketsTextListener() {

    const removeBracketsTextListener = vscode.window.onDidChangeTextEditorSelection(event => {    
        if (event.kind !== vscode.TextEditorSelectionChangeKind.Keyboard) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
    
        if (!editor.selection.isEmpty) {
            return;
        }

        const now = Date.now();
        if (now - lastexecutiontime < 500) {
            return;
        }
        lastexecutiontime = now;

        const document = editor.document;
        const position = editor.selection.active; 
    
        const rangeBeforeCursor = new vscode.Range(position.translate(0, -2), position);
        const textBeforeCursor = document.getText(rangeBeforeCursor);
    
        if (textBeforeCursor === '{}') {
            const workspaceEdit = new vscode.WorkspaceEdit();
            
            workspaceEdit.delete(document.uri, rangeBeforeCursor);
            workspaceEdit.insert(document.uri, position.translate(0, -2), ' ');

            vscode.workspace.applyEdit(workspaceEdit).then(success => {
                if (success) {
                    vscode.commands.executeCommand('editor.action.triggerSuggest');
            }});

        }
    });
    
    return removeBracketsTextListener;

}

