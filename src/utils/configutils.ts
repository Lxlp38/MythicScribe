import * as vscode from 'vscode';

import { ScribeLogger } from './logger';

const configCache = {
    enableMythicScriptSyntax: undefined as boolean | undefined,
    datasetSource: undefined as string | undefined,
    attributeAliasUsedInCompletions: undefined as string | undefined,
};

let configChangeFunctionCallbacks: (() => void)[] | undefined;
function getConfigChangeFunctionCallbacks() {
    if (configChangeFunctionCallbacks === undefined) {
        configChangeFunctionCallbacks = [];
    }
    return configChangeFunctionCallbacks;
}
export function addConfigChangeFunction(callback: () => void) {
    getConfigChangeFunctionCallbacks().push(callback);
}

function resetConfigCache() {
    ScribeLogger.debug('Resetting config cache');
    for (const key in configCache) {
        if (configCache.hasOwnProperty(key)) {
            configCache[key as keyof typeof configCache] = undefined;
        }
    }
    for (const callback of getConfigChangeFunctionCallbacks()) {
        callback();
    }
}
export const configHandler = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('MythicScribe')) {
        ScribeLogger.debug('MythicScribe configuration changed');
        resetConfigCache();
    }
});

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
    if (configCache.datasetSource === undefined) {
        configCache.datasetSource = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('datasetSource');
    }
    return configCache.datasetSource;
}

export function enableMythicScriptSyntax() {
    if (configCache.enableMythicScriptSyntax === undefined) {
        configCache.enableMythicScriptSyntax = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('enableMythicScriptSyntax');
    }
    return configCache.enableMythicScriptSyntax;
}

export function getAttributeAliasUsedInCompletions() {
    if (configCache.attributeAliasUsedInCompletions === undefined) {
        configCache.attributeAliasUsedInCompletions = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('attributeAliasUsedInCompletions');
    }
    return configCache.attributeAliasUsedInCompletions;
}

export function getLogLevel() {
    function fromStringToNumber(string: string) {
        switch (string) {
            case 'error':
                return vscode.LogLevel.Error;
            case 'warn':
                return vscode.LogLevel.Warning;
            case 'info':
                return vscode.LogLevel.Info;
            case 'debug':
                return vscode.LogLevel.Debug;
            default:
                return vscode.LogLevel.Debug;
        }
    }

    const returnValue = vscode.workspace.getConfiguration('MythicScribe').get('logLevel');
    if (typeof returnValue === 'string') {
        return fromStringToNumber(returnValue);
    }
    return undefined;
}

const MinecraftVersions = ['latest', '1.21.3', '1.21.1', '1.20.6', '1.20.5', '1.20.4', '1.19.4'];
export function minecraftVersion() {
    const config = vscode.workspace.getConfiguration('MythicScribe');
    const value = config.get<string>('minecraftVersion');

    // Check if the value is invalid
    if (typeof value !== 'string' || !MinecraftVersions.includes(value)) {
        const inspected = config.inspect<string>('minecraftVersion');
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
        ScribeLogger.warn(
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
