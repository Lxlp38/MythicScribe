import * as vscode from 'vscode';


export function isAlwaysEnabled() {
    return vscode.workspace.getConfiguration('MythicScribe').get('alwaysEnabled');
}

export function isEnabled(document: vscode.TextDocument): boolean {
    if (isAlwaysEnabled()) {
        return true;
    }
    const regex: string|undefined = vscode.workspace.getConfiguration('MythicScribe').get<string>('regexForMythicmobsFile');
    const path = document.uri.fsPath;
    if (regex && new RegExp(regex).test(path)) {
        return true;
    }
    return false;
}

export function isMetaskillFile(document: vscode.TextDocument): boolean {
    const regex: string|undefined = vscode.workspace.getConfiguration('MythicScribe').get<string>('regexForMetaskillFile');
    const path = document.uri.fsPath;
    if (regex && new RegExp(regex).test(path)) {
        return true;
    }
    return false;
}

export function enableEmptyBracketsAutomaticRemoval() {
    return vscode.workspace.getConfiguration('MythicScribe').get('enableEmptyBracketsAutomaticRemoval');
}

export function enableFileSpecificSuggestions() {
    return vscode.workspace.getConfiguration('MythicScribe').get('enableFileSpecificSuggestions');
}

export function enableShortcuts() {
    return vscode.workspace.getConfiguration('MythicScribe').get('enableShortcuts');
}

export function datasetSource(){
    return vscode.workspace.getConfiguration('MythicScribe').get('dataset');
}