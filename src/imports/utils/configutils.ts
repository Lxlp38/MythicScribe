import * as vscode from 'vscode';
import { enableSubscriptions, disableSubscriptions, enableSkillfileSubscriptions, disableSkillfileSubscriptions, enableTriggerFileSubscriptions, disableTriggerFileSubscriptions } from '../../MythicScribe';


function resetFileChecks() {
    isEnabled = false;
    isMetaskillFile = false;
    isMobFile = false;
    isTriggerFile = false;
}
export let isEnabled = false;
export let isMetaskillFile = false;
export let isMobFile = false;
export let isTriggerFile = false;

export const extensionEnabler = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (!editor) {
        return
    }
    const document = editor.document;
    updateEnabled(document);
});

// Updates the enabled features
export function updateEnabled(document: vscode.TextDocument) {
    if (isEnabled != checkEnabled(document)) {
        isEnabled = checkEnabled(document);
        console.log('updateEnabled', isEnabled);
        if (isEnabled) {
            enableSubscriptions();
        }
        else {
            disableSubscriptions();
            resetFileChecks();
        }
    }

    // Don't check other things if the extension is disabled to begin with
    if (!isEnabled) return;

    // Check if the file is a metaskill file
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

    // Check if the file is a mob file
    if (isMobFile != checkMobFile(document)) {
        isMobFile = checkMobFile(document);
        console.log('updateMobFile', isMobFile);
    }

    // Check if the file is a trigger file
    const newisTriggerFile = isMobFile;
    if (isTriggerFile != newisTriggerFile) {
        isTriggerFile = newisTriggerFile;
        console.log('updateTriggerFile', isTriggerFile);
        if (isTriggerFile) {
            enableTriggerFileSubscriptions();
        }
        else {
            disableTriggerFileSubscriptions();
        }
    }

}


// Check for enabled features
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

export function checkMobFile(document: vscode.TextDocument): boolean {
    const regex: string | undefined = vscode.workspace.getConfiguration('MythicScribe').get<string>('regexForMobFile');
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