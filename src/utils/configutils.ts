import * as vscode from 'vscode';

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
    const regex: string | undefined = vscode.workspace
        .getConfiguration('MythicScribe')
        .get<string>('regexForMythicmobsFile');
    return checkFile(document, regex);
}
export function checkMetaskillFile(document: vscode.TextDocument): boolean {
    const regex: string | undefined = vscode.workspace
        .getConfiguration('MythicScribe')
        .get<string>('regexForMetaskillFile');
    return checkFile(document, regex);
}
export function checkMobFile(document: vscode.TextDocument): boolean {
    const regex: string | undefined = vscode.workspace
        .getConfiguration('MythicScribe')
        .get<string>('regexForMobFile');
    return checkFile(document, regex);
}
export function checkItemFile(document: vscode.TextDocument): boolean {
    const regex: string | undefined = vscode.workspace
        .getConfiguration('MythicScribe')
        .get<string>('regexForItemFile');
    return checkFile(document, regex);
}

export function enableEmptyBracketsAutomaticRemoval(): boolean {
    return (
        vscode.workspace
            .getConfiguration('MythicScribe')
            .get('enableEmptyBracketsAutomaticRemoval') || true
    );
}

export function enableFileSpecificSuggestions(): boolean {
    return (
        vscode.workspace.getConfiguration('MythicScribe').get('enableFileSpecificSuggestions') ||
        true
    );
}

export function enableShortcuts(): boolean {
    return vscode.workspace.getConfiguration('MythicScribe').get('enableShortcuts') || true;
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

const MinecraftVersions = ['latest', '1.21.1', '1.20.6', '1.20.5', '1.20.4', '1.19.4'];
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
        vscode.window.showWarningMessage(
            'Invalid MythicScribe.minecraftVersion configuration value detected. Resetting to "latest".'
        );
        return 'latest';
    }

    return config.get<string>('minecraftVersion');
}
