import * as vscode from 'vscode';
import { RandomSpawnSchema } from '@common/schemas/randomSpawnSchema';
import Log from '@common/utils/logger';
import { ReagentSchema } from '@common/schemas/reagentSchema';

import {
    checkMythicMobsFile,
    enableMythicScriptSyntax,
    checkFileEnabled,
    fileRegexConfigCache,
} from '../utils/configutils';
import { AbstractScribeSubscription, ScribeSubscriptionHandler } from './SubscriptionHandler';
import { MetaskillSchema } from '../schemas/metaskillSchema';
import { MobSchema } from '../schemas/mobSchema';
import { ItemSchema } from '../schemas/itemSchema';
import { DroptableSchema } from '../schemas/droptableSchema';
import { Schema, registryKey } from '../objectInfos';
import { StatSchema } from '../schemas/statSchema';

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
    randomspawn: false,
    reagent: false,
};

export const extensionEnabler = vscode.window.onDidChangeActiveTextEditor((editor) => {
    Log.debug('MythicScribe active editor changed');
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
    schema?: Schema;
    key: registryKey;
    configKey: keyof typeof fileRegexConfigCache;
    subscriptionHandler: keyof typeof ScribeSubscriptionHandler.registry;
}
const FileTypeInfoMap: {
    [K in registryKey]: FileTypeInfo;
} = {
    metaskill: {
        schema: MetaskillSchema,
        key: 'metaskill',
        configKey: 'Metaskill',
        subscriptionHandler: 'metaskill',
    },
    mob: {
        schema: MobSchema,
        key: 'mob',
        configKey: 'Mob',
        subscriptionHandler: 'mob',
    },
    item: {
        schema: ItemSchema,
        key: 'item',
        configKey: 'Item',
        subscriptionHandler: 'item',
    },
    droptable: {
        schema: DroptableSchema,
        key: 'droptable',
        configKey: 'Droptable',
        subscriptionHandler: 'droptable',
    },
    stat: {
        schema: StatSchema,
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
    randomspawn: {
        schema: RandomSpawnSchema,
        key: 'randomspawn',
        configKey: 'RandomSpawn',
        subscriptionHandler: 'randomspawn',
    },
    reagent: {
        schema: ReagentSchema,
        key: 'reagent',
        configKey: 'Reagent',
        subscriptionHandler: 'reagent',
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
