import * as vscode from 'vscode';

import Log from './logger';
import { MinecraftVersions, attributeAliasUsedInCompletions, DatasetSource } from '../packageData';

const configCache = {
    enableMythicScriptSyntax: undefined as boolean | undefined,
    datasetSource: undefined as string | undefined,
    attributeAliasUsedInCompletions: undefined as string | undefined,
    isAlwaysEnabled: undefined as boolean | undefined,
    allowExternalTools: undefined as boolean | undefined,
};

export const fileRegexConfigCache = {
    MythicMobs: undefined as string | undefined,
    Metaskill: undefined as string | undefined,
    Mob: undefined as string | undefined,
    Item: undefined as string | undefined,
    Droptable: undefined as string | undefined,
    Stat: undefined as string | undefined,
    Pin: undefined as string | undefined,
    Placeholder: undefined as string | undefined,
    RandomSpawn: undefined as string | undefined,
    EquipmentSet: undefined as string | undefined,
    Archetype: undefined as string | undefined,
    Reagent: undefined as string | undefined,
    Menu: undefined as string | undefined,
    Achievement: undefined as string | undefined,
};

const fileParsingPolicyConfigCache = {
    parseOnStartup: undefined as boolean | undefined,
    parseOnSave: undefined as boolean | undefined,
    parseOnModification: undefined as boolean | undefined,
    parsingGlobPattern: undefined as string | undefined,
    excludeGlobPattern: undefined as string | undefined,
    parallelParsingLimit: undefined as number | undefined,
};

const colorProviderOptionsConfigCache = {
    alwaysEnabled: undefined as boolean | undefined,
    backgroundColor: undefined as string | undefined,
    charColor: undefined as string | undefined,
};

const diagnosticsPolicyConfigCache = {
    enabled: undefined as boolean | undefined,
};

const nodeGraphConfigCache = {
    wheelSensitivity: undefined as number | undefined,
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
    function resetSpecificConfig(cache: { [key: string]: string | boolean | number | undefined }) {
        for (const key in cache) {
            if (cache.hasOwnProperty(key)) {
                cache[key as keyof typeof cache] = undefined;
            }
        }
    }
    Log.debug('Resetting config cache');
    resetSpecificConfig(configCache);
    resetSpecificConfig(fileRegexConfigCache);
    resetSpecificConfig(fileParsingPolicyConfigCache);
    resetSpecificConfig(colorProviderOptionsConfigCache);
    resetSpecificConfig(diagnosticsPolicyConfigCache);
    resetSpecificConfig(nodeGraphConfigCache);
    for (const callback of getConfigChangeFunctionCallbacks()) {
        callback();
    }
}
export const configHandler = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('MythicScribe')) {
        Log.debug('MythicScribe configuration changed');
        resetConfigCache();
    }
});

export function getGenericConfig(key: keyof typeof configCache) {
    if (configCache[key] === undefined) {
        configCache[key] = vscode.workspace.getConfiguration('MythicScribe').get(key);
    }
    return configCache[key];
}

// Check for enabled features
export function isAlwaysEnabled() {
    if (configCache.isAlwaysEnabled === undefined) {
        configCache.isAlwaysEnabled = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('alwaysEnabled');
    }
    return configCache.isAlwaysEnabled;
}

function checkFileRegex(uri: vscode.Uri, regex: string | undefined): boolean {
    if (regex && new RegExp(regex).test(uri.fsPath)) {
        return true;
    }
    return false;
}
export function checkFileEnabled(
    uri: vscode.Uri,
    configKey: keyof typeof fileRegexConfigCache
): boolean {
    if (fileRegexConfigCache[configKey] === undefined) {
        fileRegexConfigCache[configKey] = vscode.workspace
            .getConfiguration('MythicScribe')
            .get<string>('fileRegex.' + configKey);
    }
    return checkFileRegex(uri, fileRegexConfigCache[configKey]);
}
export function checkMythicMobsFile(uri: vscode.Uri): boolean {
    if (isAlwaysEnabled()) {
        return true;
    }
    return checkFileEnabled(uri, 'MythicMobs');
}

export function getFileParserPolicyConfig(key: keyof typeof fileParsingPolicyConfigCache) {
    if (fileParsingPolicyConfigCache[key] === undefined) {
        fileParsingPolicyConfigCache[key] = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('fileParsingPolicy.' + key);
    }
    return fileParsingPolicyConfigCache[key];
}

export function getColorProviderOptionsConfig(key: keyof typeof colorProviderOptionsConfigCache) {
    if (colorProviderOptionsConfigCache[key] === undefined) {
        colorProviderOptionsConfigCache[key] = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('colorProviderOptions.' + key);
    }
    return colorProviderOptionsConfigCache[key];
}

export function getDiagnosticsPolicyConfig(key: keyof typeof diagnosticsPolicyConfigCache) {
    if (diagnosticsPolicyConfigCache[key] === undefined) {
        diagnosticsPolicyConfigCache[key] = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('diagnosticsPolicy.' + key);
    }
    return diagnosticsPolicyConfigCache[key];
}

export function getNodeGraphConfig(key: keyof typeof nodeGraphConfigCache) {
    if (nodeGraphConfigCache[key] === undefined) {
        nodeGraphConfigCache[key] = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('nodeGraph.' + key);
    }
    return nodeGraphConfigCache[key];
}

export function enableEmptyBracketsAutomaticRemoval(): boolean {
    const ret = vscode.workspace
        .getConfiguration('MythicScribe')
        .get('enableEmptyBracketsAutomaticRemoval') as boolean;
    return ret;
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

export function datasetSource(): DatasetSource {
    if (configCache.datasetSource === undefined) {
        configCache.datasetSource = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('datasetSource');
    }
    return configCache.datasetSource as DatasetSource;
}

export function enableMythicScriptSyntax() {
    if (configCache.enableMythicScriptSyntax === undefined) {
        configCache.enableMythicScriptSyntax = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('enableMythicScriptSyntax');
    }
    return configCache.enableMythicScriptSyntax;
}

export function getAttributeAliasUsedInCompletions(): attributeAliasUsedInCompletions {
    if (configCache.attributeAliasUsedInCompletions === undefined) {
        configCache.attributeAliasUsedInCompletions = vscode.workspace
            .getConfiguration('MythicScribe')
            .get('attributeAliasUsedInCompletions');
    }
    return configCache.attributeAliasUsedInCompletions as attributeAliasUsedInCompletions;
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
            case 'trace':
                return vscode.LogLevel.Trace;
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

export function minecraftVersion() {
    const config = vscode.workspace.getConfiguration('MythicScribe');
    const value = config.get<string>('minecraftVersion');

    if (value === 'latest') {
        return MinecraftVersions[0];
    }

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
        Log.warn(
            'Invalid MythicScribe.minecraftVersion configuration value detected. Resetting to default value "latest".'
        );
        return MinecraftVersions[0];
    }

    return value;
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

/**
 * Determines whether a specified plugin is enabled.
 *
 * If the plugin is not specified (`undefined`), it is considered enabled by default.
 * If the plugin's enabled state is cached, the cached value is returned.
 * Otherwise, the function checks the enabled plugins list, updates the cache,
 * and returns the plugin's enabled state.
 *
 * @param plugin - The name of the plugin to check, or `undefined` to default to enabled.
 * @returns `true` if the plugin is enabled, `false` otherwise.
 */
export function isPluginEnabled(plugin: string | undefined) {
    if (plugin === undefined) {
        return true;
    }
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
