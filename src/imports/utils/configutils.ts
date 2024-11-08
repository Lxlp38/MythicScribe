import * as vscode from 'vscode';
import { enableSubscriptions, disableSubscriptions, enableSkillfileSubscriptions, disableSkillfileSubscriptions, enableTriggerFileSubscriptions, disableTriggerFileSubscriptions, enableMobfileSubscriptions, disableMobfileSubscriptions, enableItemFileSubscriptions, disableItemFileSubscriptions } from '../../MythicScribe';


function resetFileChecks() {
    isEnabled = false;
    isMetaskillFile = false;
    isMobFile = false;
    isItemFile = false;
    isTriggerFile = false;
}
export let isEnabled = false;
export let isMetaskillFile = false;
export let isMobFile = false;
export let isItemFile = false;
export let isTriggerFile = false;



export const extensionEnabler = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (!editor) {
        return;
    }
    const document = editor.document;
    updateEnabled(document);
});

export async function checkIfMythicScriptFile(document: vscode.TextDocument) {
    if (document.languageId !== 'yaml') {
        return;
    }
    if (checkEnabled(document)) {
        vscode.languages.setTextDocumentLanguage(document, 'mythicscript');
    }
}

// Updates the enabled features
export function updateEnabled(document: vscode.TextDocument) {

    if (enableMythicScriptSyntax()) {
        checkIfMythicScriptFile(document);
    }

    if (isEnabled !== checkEnabled(document)) {
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
    if (!isEnabled) {
        return;
    }

    // Check if the file is a metaskill file
    if (isMetaskillFile !== checkMetaskillFile(document)) {
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
    if (isMobFile !== checkMobFile(document)) {
        isMobFile = checkMobFile(document);
        console.log('updateMobFile', isMobFile);
        if (isMobFile) {
            enableMobfileSubscriptions();
        }
        else {
            disableMobfileSubscriptions();
        }
    }

    // Check if the file is an item file
    if (isItemFile !== checkItemFile(document)) {
        isItemFile = checkItemFile(document);
        console.log('updateItemFile', isItemFile);
        if (isItemFile) {
            enableItemFileSubscriptions();
        }
        else {
            disableItemFileSubscriptions();
        }
    }


    // Check if the file is a trigger file
    const newisTriggerFile = isMobFile || isItemFile;
    if (isTriggerFile !== newisTriggerFile) {
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

function checkFile(document: vscode.TextDocument, regex: string | undefined): boolean {
    const path = document.uri.fsPath;
    if (regex && new RegExp(regex).test(path)) {
        return true;
    }
    return false;
}
export function checkEnabled(document: vscode.TextDocument): boolean {
    if (isAlwaysEnabled()) {
        return true;
    }
    const regex: string | undefined = vscode.workspace.getConfiguration('MythicScribe').get<string>('regexForMythicmobsFile');
    return checkFile(document, regex);
}
export function checkMetaskillFile(document: vscode.TextDocument): boolean {
    const regex: string | undefined = vscode.workspace.getConfiguration('MythicScribe').get<string>('regexForMetaskillFile');
    return checkFile(document, regex);
}
export function checkMobFile(document: vscode.TextDocument): boolean {
    const regex: string | undefined = vscode.workspace.getConfiguration('MythicScribe').get<string>('regexForMobFile');
    return checkFile(document, regex);
}
export function checkItemFile(document: vscode.TextDocument): boolean {
    const regex: string | undefined = vscode.workspace.getConfiguration('MythicScribe').get<string>('regexForItemFile');
    return checkFile(document, regex);
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

export function enableMythicScriptSyntax() {
    return vscode.workspace.getConfiguration('MythicScribe').get('enableMythicScriptSyntax');
}