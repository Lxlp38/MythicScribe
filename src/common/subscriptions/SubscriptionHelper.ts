import * as vscode from 'vscode';

import {
    checkMythicMobsFile,
    enableMythicScriptSyntax,
    checkFileEnabled,
    fileRegexConfigCache,
} from '../utils/configutils';
import { AbstractScribeSubscription, ScribeSubscriptionHandler } from './SubscriptionHandler';
import { MetaskillFileObjects } from '../schemas/metaskillFileObjects';
import { MobFileObjects } from '../schemas/mobFileObjects';
import { ItemFileObjects } from '../schemas/itemfileObjects';
import { DroptableFileObject } from '../schemas/droptableFileObjects';
import { FileObjectMap, registryKey } from '../objectInfos';
import { StatFileObjects } from '../schemas/statfileObjects';

function resetFileChecks() {
    for (const key of Object.keys(ActiveFileTypeInfo) as (keyof typeof ActiveFileTypeInfo)[]) {
        ActiveFileTypeInfo[key] = false;
    }
}

type ActiveFileTypeInfoKeys = registryKey | 'enabled';
export const ActiveFileTypeInfo: { [K in ActiveFileTypeInfoKeys]: boolean } = {
    enabled: false,
    metaskill: false,
    mob: false,
    item: false,
    droptable: false,
    stat: false,
    placeholder: false,
};

export const extensionEnabler = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor) {
        return;
    }
    updateSubscriptions(editor.document);
});

/**
 * Checks if the given document is a MythicMobs script file and changes its language mode to 'mythicscript' if it is.
 *
 * @param document - The text document to check.
 * @returns A promise that resolves when the check is complete.
 */
export async function checkIfMythicScriptFile(document: vscode.TextDocument) {
    if (document.languageId !== 'yaml') {
        return;
    }
    if (checkMythicMobsFile(document.uri)) {
        vscode.languages.setTextDocumentLanguage(document, 'mythicscript');
    }
}

/**
 * Enables or disables a subscriptions based on the provided flag values.
 *
 * @param flag - The current state of the flag.
 * @param newflagvalue - The new state to set the flag to.
 * @param handler - The subscription handler that manages the subscriptions.
 * @returns The new state of the flag.
 */
function fileSpecificEnabler(
    flag: boolean,
    newflagvalue: boolean,
    handler: AbstractScribeSubscription
): boolean {
    if (flag !== newflagvalue) {
        if (newflagvalue) {
            handler.enableAll();
        } else {
            handler.disposeAll();
        }
    }
    return newflagvalue;
}

/**
 * Updates the state of various subscriptions based on the provided document.
 *
 * This function performs the following steps:
 * 1. Checks if MythicScript syntax is enabled and verifies if the document is a MythicScript file.
 * 2. Updates the global enabled state based on whether the document is a MythicMobs file.
 * 3. If the global enabled state changes, it enables or disposes all subscriptions accordingly.
 * 4. If the extension is disabled, it exits early.
 * 5. Otherwise, it checks and updates the enabled state for specific file types (Metaskill, Mob, Item, Droptable, Stat)
 *    and enables or disables the corresponding subscriptions.
 *
 * @param document - The text document to check and update subscriptions for.
 */
export function updateSubscriptions(document: vscode.TextDocument) {
    if (enableMythicScriptSyntax()) {
        checkIfMythicScriptFile(document);
    }
    const uri = document.uri;

    const isMythicFile = checkMythicMobsFile(uri);
    if (ActiveFileTypeInfo.enabled !== isMythicFile) {
        ActiveFileTypeInfo.enabled = isMythicFile;
        if (ActiveFileTypeInfo.enabled) {
            ScribeSubscriptionHandler.registry.global.enableAll();
        } else {
            ScribeSubscriptionHandler.disposeAll();
            resetFileChecks();
            return;
        }
    }

    // Don't check other things if the extension is disabled to begin with
    if (!ActiveFileTypeInfo.enabled) {
        return;
    }

    for (const info of Object.values(FileTypeInfoMap)) {
        ActiveFileTypeInfo[info.key] = fileSpecificEnabler(
            ActiveFileTypeInfo[info.key],
            checkFileEnabled(uri, info.configKey),
            ScribeSubscriptionHandler.registry[info.subscriptionHandler]
        );
    }
}

interface FileTypeInfo {
    schema?: FileObjectMap;
    key: registryKey;
    configKey: keyof typeof fileRegexConfigCache;
    subscriptionHandler: keyof typeof ScribeSubscriptionHandler.registry;
}
const FileTypeInfoMap: {
    [K in registryKey]: FileTypeInfo;
} = {
    metaskill: {
        schema: MetaskillFileObjects,
        key: 'metaskill',
        configKey: 'Metaskill',
        subscriptionHandler: 'metaskill',
    },
    mob: {
        schema: MobFileObjects,
        key: 'mob',
        configKey: 'Mob',
        subscriptionHandler: 'mob',
    },
    item: {
        schema: ItemFileObjects,
        key: 'item',
        configKey: 'Item',
        subscriptionHandler: 'item',
    },
    droptable: {
        schema: DroptableFileObject,
        key: 'droptable',
        configKey: 'Droptable',
        subscriptionHandler: 'droptable',
    },
    stat: {
        schema: StatFileObjects,
        key: 'stat',
        configKey: 'Stat',
        subscriptionHandler: 'stat',
    },
    placeholder: {
        schema: undefined,
        key: 'placeholder',
        configKey: 'Placeholder',
        subscriptionHandler: 'placeholder',
    },
};

export function checkFileType(uri: vscode.Uri): FileTypeInfo | undefined {
    if (!checkMythicMobsFile(uri)) {
        return undefined;
    }
    for (const info of Object.values(FileTypeInfoMap)) {
        if (info.configKey && checkFileEnabled(uri, info.configKey)) {
            return info;
        }
    }
    return undefined;
}
