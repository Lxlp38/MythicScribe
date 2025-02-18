import * as vscode from 'vscode';

import { logWarning } from './logger';

// Check for enabled features
export function isAlwaysEnabled() {
    return vscode.workspace.getConfiguration('MythicScribe').get('alwaysEnabled');
}

export enum fileRegexProperties {
    MYTHICMOBS = 'fileRegex.MythicMobs',
    METASKILL = 'fileRegex.Metaskill',
    MOB = 'fileRegex.Mob',
    ITEM = 'fileRegex.Item',
    DROPTABLE = 'fileRegex.Droptable',
    STAT = 'fileRegex.Stat',
}

function checkFileRegex(document: vscode.TextDocument, regex: string | undefined): boolean {
    const path = document.uri.fsPath;
    if (regex && new RegExp(regex).test(path)) {
        return true;
    }
    return false;
}
export function checkFileEnabled(document: vscode.TextDocument, configKey: string): boolean {
    const regex: string | undefined = vscode.workspace
        .getConfiguration('MythicScribe')
        .get<string>(configKey);
    return checkFileRegex(document, regex);
}
export function checkMythicMobsFile(document: vscode.TextDocument): boolean {
    if (isAlwaysEnabled()) {
        return true;
    }
    return checkFileEnabled(document, fileRegexProperties.MYTHICMOBS);
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

const MinecraftVersions = ['latest', '1.21.3', '1.21.1', '1.20.6', '1.20.5', '1.20.4', '1.19.4'];
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
        logWarning(
            'Invalid MythicScribe.minecraftVersion configuration value detected. Resetting to "latest".'
        );
        return 'latest';
    }

    return config.get<string>('minecraftVersion');
}

function getEnabledPlugins(): { [key: string]: boolean } {
    const config = vscode.workspace.getConfiguration('MythicScribe');
    return config.get<{ [key: string]: boolean }>('enabledPlugins') || {};
}

let enabledPluginsCacheWasModified = false;
const enabledPluginsCache: { [key: string]: boolean | undefined } = getEnabledPlugins();
async function setEnabledPlugin(plugin: string, enabled: boolean = true) {
    enabledPluginsCache[plugin] = enabled;
    enabledPluginsCacheWasModified = true;
}

export async function finallySetEnabledPlugins() {
    if (enabledPluginsCacheWasModified) {
        vscode.workspace
            .getConfiguration('MythicScribe')
            .update('enabledPlugins', enabledPluginsCache);
        enabledPluginsCacheWasModified = false;
    }
}

export function checkEnabledPlugin(plugin: string) {
    if (enabledPluginsCache[plugin] !== undefined) {
        return enabledPluginsCache[plugin];
    }

    const enabledPlugins = getEnabledPlugins();
    const maybePlugin = enabledPlugins[plugin];

    if (maybePlugin === undefined) {
        setEnabledPlugin(plugin, true);
        enabledPluginsCache[plugin] = true;
        return true;
    }

    enabledPluginsCache[plugin] = maybePlugin;
    return maybePlugin;
}
