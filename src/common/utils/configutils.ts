import * as vscode from 'vscode';

import Log from './logger';
import { MinecraftVersions, attributeAliasUsedInCompletions, DatasetSource } from '../packageData';

class ConfigCache<T extends Record<string, string | boolean | number | undefined>> {
    private cache: T;
    private prefix: string;

    constructor(initialCache: T, prefix: string = '') {
        this.cache = initialCache;
        this.prefix = prefix ? `${prefix}.` : '';
    }

    get<K extends keyof T>(key: K): T[K] {
        if (this.cache[key] === undefined) {
            this.cache[key] = vscode.workspace
                .getConfiguration('MythicScribe')
                .get(this.prefix + String(key)) as T[K];
        }
        return this.cache[key];
    }

    reset() {
        for (const key in this.cache) {
            if (Object.hasOwn(this.cache, key)) {
                this.cache[key] = undefined as T[typeof key];
            }
        }
    }
}

const genericConfigCache = {
    enableMythicScriptSyntax: undefined as boolean | undefined,
    datasetSource: undefined as DatasetSource | undefined,
    attributeAliasUsedInCompletions: undefined as attributeAliasUsedInCompletions | undefined,
    alwaysEnabled: undefined as boolean | undefined,
    allowExternalTools: undefined as boolean | undefined,
    enableEmptyBracketsAutomaticRemoval: undefined as boolean | undefined,
    enableFileSpecificSuggestions: undefined as boolean | undefined,
    enableShortcuts: undefined as boolean | undefined,
    minecraftVersion: undefined as string | undefined,
    logLevel: undefined as string | undefined,
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

const decorationOptions = {
    delayTracking: undefined as boolean | undefined,
    soundPlayback: undefined as boolean | undefined,
};

export const ConfigProvider = {
    registry: {
        generic: new ConfigCache(genericConfigCache),
        fileRegex: new ConfigCache(fileRegexConfigCache, 'fileRegex'),
        fileParsingPolicy: new ConfigCache(fileParsingPolicyConfigCache, 'fileParsingPolicy'),
        colorProviderOptions: new ConfigCache(
            colorProviderOptionsConfigCache,
            'colorProviderOptions'
        ),
        diagnosticsPolicy: new ConfigCache(diagnosticsPolicyConfigCache, 'diagnosticsPolicy'),
        nodeGraph: new ConfigCache(nodeGraphConfigCache, 'nodeGraph'),
        decorationOptions: new ConfigCache(decorationOptions, 'decorationOptions'),
    },

    reset() {
        Log.debug('Resetting generic config cache');
        (Object.keys(this.registry) as Array<keyof typeof this.registry>).forEach((key) => {
            this.registry[key].reset();
        });
    },
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
    Log.debug('Resetting config cache');
    ConfigProvider.reset();
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
    return checkFileRegex(uri, ConfigProvider.registry.fileRegex.get(configKey));
}
export function checkMythicMobsFile(uri: vscode.Uri): boolean {
    if (ConfigProvider.registry.generic.get('alwaysEnabled')) {
        return true;
    }
    return checkFileEnabled(uri, 'MythicMobs');
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

    const returnValue = ConfigProvider.registry.generic.get('logLevel');
    if (typeof returnValue === 'string') {
        return fromStringToNumber(returnValue);
    }
    return undefined;
}

export function getMinecraftVersion(): MinecraftVersions {
    const config = vscode.workspace.getConfiguration('MythicScribe');
    const value = ConfigProvider.registry.generic.get('minecraftVersion');

    if (value === 'latest') {
        return MinecraftVersions[0];
    }

    // Check if the value is invalid
    if (typeof value !== 'string' || !(MinecraftVersions as readonly string[]).includes(value)) {
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

    return value as MinecraftVersions;
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
