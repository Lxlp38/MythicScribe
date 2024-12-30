import * as vscode from 'vscode';
import { enableSubscriptions, disableSubscriptions, enableSkillfileSubscriptions, disableSkillfileSubscriptions, enableMobfileSubscriptions, disableMobfileSubscriptions, enableItemFileSubscriptions, disableItemFileSubscriptions } from '../MythicScribe';


function resetFileChecks() {
    isEnabled = false;
    isMetaskillFile = false;
    isMobFile = false;
    isItemFile = false;
}
export let isEnabled = false;
export let isMetaskillFile = false;
export let isMobFile = false;
export let isItemFile = false;



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

export function getAttributeAliasUsedInCompletions() {
    return vscode.workspace.getConfiguration('MythicScribe').get('attributeAliasUsedInCompletions');
}

const MinecraftVersions = [
    "latest",
    "1.21.1",
    "1.20.6",
    "1.20.5",
    "1.20.4",
    "1.19.4"
  ];
export function minecraftVersion() {
    const config = vscode.workspace.getConfiguration('MythicScribe');
    const inspected = config.inspect<string>('minecraftVersion');
    const value = config.get<string>('minecraftVersion');

    // Check if the value is invalid
    if (typeof value !== 'string' || !MinecraftVersions.includes(value)) {
        let target: vscode.ConfigurationTarget | undefined;

        // Determine the scope where the value is defined
        if (inspected?.workspaceFolderValue !== undefined) {
            target = vscode.ConfigurationTarget.WorkspaceFolder;
        } else if (inspected?.workspaceValue !== undefined) {
            target = vscode.ConfigurationTarget.Workspace;
        } else {
            target = vscode.ConfigurationTarget.Global;
        }

        // Update the value only in the defined scope
        config.update('minecraftVersion', undefined, target);
        vscode.window.showWarningMessage('Invalid MythicScribe.minecraftVersion configuration value detected. Resetting to "latest".');
        return 'latest';
    }

    return config.get<string>('minecraftVersion');
}