import * as vscode from 'vscode';

const config = vscode.workspace.getConfiguration('MythicScribe');

export function isAlwaysEnabled() {
    return config.get('alwaysEnabled');
}

export function isEnabled(document: vscode.TextDocument): boolean {
    if (isAlwaysEnabled()) {
        return true;
    }
    const path = document.uri.fsPath.toLowerCase();
    if (path.includes('mythicmobs')) {
        return true;
    }
    return false;
}