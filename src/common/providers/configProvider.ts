import * as vscode from 'vscode';

import { getLogger } from './loggerProvider';
import {
    MinecraftVersions,
    attributeAliasUsedInCompletions,
    DatasetSource,
    LogLevel,
} from '../packageData';
import { CallbackProvider } from './callbackProvider';
import { executeFunctionAfterActivation } from '../../MythicScribe';

class ConfigCache<
    T extends Record<string, string | boolean | number | undefined>,
> extends CallbackProvider<'configChange'> {
    private cache: T;
    private prefix: string;
    private plugin: string;
    private configChangeEvent: vscode.Disposable;

    constructor(initialCache: T, prefix?: string, plugin: string = 'MythicScribe') {
        super();
        this.cache = initialCache;
        this.prefix = prefix ? `${prefix}.` : '';
        this.plugin = plugin;
        const section = plugin + (prefix ? '.' + prefix : '');

        this.configChangeEvent = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration(section)) {
                getLogger().trace(`${section} configuration changed`);
                this.reset();
            }
        });

        executeFunctionAfterActivation((context) => {
            context.subscriptions.push(this.configChangeEvent);
        });
    }

    get<K extends keyof T>(key: K): T[K] {
        if (this.cache[key] === undefined) {
            this.cache[key] = vscode.workspace
                .getConfiguration(this.plugin)
                .get(this.prefix + String(key)) as T[K];
            getLogger().trace(`Config Cached: ${this.prefix}${String(key)} = ${this.cache[key]}`);
        }
        return this.cache[key];
    }

    reset() {
        for (const key in this.cache) {
            if (Object.hasOwn(this.cache, key)) {
                this.cache[key] = undefined as T[typeof key];
            }
        }
        this.runCallbacks('configChange');
    }

    dispose() {
        this.configChangeEvent.dispose();
        getLogger().debug(`Disposed config cache for ${this.prefix}`);
    }
}

const genericConfigCache = {
    enableMythicScriptSyntax: undefined as boolean | undefined,
    datasetSource: undefined as DatasetSource | undefined,
    attributeAliasUsedInCompletions: undefined as attributeAliasUsedInCompletions | undefined,
    alwaysEnabled: undefined as boolean | undefined,
    allowExternalTools: undefined as boolean | undefined,
    enableEmptyBracketsAutomaticRemoval: undefined as boolean | undefined,
    enableShortcuts: undefined as boolean | undefined,
    minecraftVersion: undefined as string | undefined,
    logLevel: undefined as LogLevel | undefined,
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
    specificSoundPlayback: undefined as boolean | undefined,
};

const editorConfigCache = {
    acceptSuggestionOnEnter: undefined as 'off' | 'smart' | 'on' | undefined,
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
        editor: new ConfigCache(editorConfigCache, undefined, 'editor'),
    },

    // reset() {
    //     getLogger().debug('Resetting config cache');
    //     for (const key in this.registry) {
    //         if (Object.hasOwn(this.registry, key)) {
    //             this.registry[key as keyof typeof this.registry].reset();
    //         }
    //     }
    // },
};

// let configChangeFunctionCallbacks: (() => void)[] | undefined;
// function getConfigChangeFunctionCallbacks() {
//     if (configChangeFunctionCallbacks === undefined) {
//         configChangeFunctionCallbacks = [];
//     }
//     return configChangeFunctionCallbacks;
// }
// export function addConfigChangeFunction(callback: () => void) {
//     getConfigChangeFunctionCallbacks().push(callback);
// }

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
    return (
        ConfigProvider.registry.generic.get('alwaysEnabled') || checkFileEnabled(uri, 'MythicMobs')
    );
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
        getLogger().warn(
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
