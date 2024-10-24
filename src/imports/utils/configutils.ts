import * as vscode from 'vscode';
import { enableSubscriptions, disableSubscriptions, enableSkillfileSubscriptions, disableSkillfileSubscriptions } from '../../MythicScribe';

export let isEnabled = false;
export let isMetaskillFile = false;

export const extensionEnabler = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (!editor) {
        return
    }
    const document = editor.document;
    updateEnabled(document);
});

export function updateEnabled(document: vscode.TextDocument) {
    if (isEnabled != checkEnabled(document)) {
        isEnabled = checkEnabled(document);
        console.log('updateEnabled', isEnabled);
        if (isEnabled) {
            enableSubscriptions();
        }
        else {
            disableSubscriptions();
            isMetaskillFile = false;
        }
    }

    // Don't check other things if the extension is disabled to begin with
    if (!isEnabled) return;

    if (isMetaskillFile != checkMetaskillFile(document)) {
        isMetaskillFile = checkMetaskillFile(document);
        console.log('updateMetaskillFile', isMetaskillFile);
        if (isMetaskillFile) {
            enableSkillfileSubscriptions();
        }
        else {
            disableSkillfileSubscriptions();
        }
    }
}

export function isAlwaysEnabled() {
    return vscode.workspace.getConfiguration('MythicScribe').get('alwaysEnabled');
}

export function checkEnabled(document: vscode.TextDocument): boolean {
    if (isAlwaysEnabled()) {
        return true;
    }
    const regex: string | undefined = vscode.workspace.getConfiguration('MythicScribe').get<string>('regexForMythicmobsFile');
    const path = document.uri.fsPath;
    if (regex && new RegExp(regex).test(path)) {
        return true;
    }
    return false;
}

export function checkMetaskillFile(document: vscode.TextDocument): boolean {
    const regex: string | undefined = vscode.workspace.getConfiguration('MythicScribe').get<string>('regexForMetaskillFile');
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

export function datasetSource() {
    return vscode.workspace.getConfiguration('MythicScribe').get('dataset');
}