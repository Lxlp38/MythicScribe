import * as vscode from 'vscode';

import {
    checkMythicMobsFile,
    enableMythicScriptSyntax,
    checkFileEnabled,
} from '../utils/configutils';
import { AbstractScribeSubscription, ScribeSubscriptionHandler } from './SubscriptionHandler';
import { MetaskillFileObjects } from '../schemas/metaskillFileObjects';
import { MobFileObjects } from '../schemas/mobFileObjects';
import { ItemFileObjects } from '../schemas/itemfileObjects';
import { DroptableFileObject } from '../schemas/droptableFileObjects';
import { FileObjectMap } from '../objectInfos';

function resetFileChecks() {
    isEnabled = false;
    isMetaskillFile = false;
    isMobFile = false;
    isItemFile = false;
    isDroptableFile = false;
    isStatFile = false;
}
export let isEnabled = false;
export let isMetaskillFile = false;
export let isMobFile = false;
export let isItemFile = false;
export let isDroptableFile = false;
export let isStatFile = false;

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
    if (isEnabled !== isMythicFile) {
        isEnabled = isMythicFile;
        if (isEnabled) {
            ScribeSubscriptionHandler.registry.global.enableAll();
        } else {
            ScribeSubscriptionHandler.disposeAll();
            resetFileChecks();
            return;
        }
    }

    // Don't check other things if the extension is disabled to begin with
    if (!isEnabled) {
        return;
    }

    isMetaskillFile = fileSpecificEnabler(
        isMetaskillFile,
        checkFileEnabled(uri, 'Metaskill'),
        ScribeSubscriptionHandler.registry.skill
    );
    isMobFile = fileSpecificEnabler(
        isMobFile,
        checkFileEnabled(uri, 'Mob'),
        ScribeSubscriptionHandler.registry.mob
    );
    isItemFile = fileSpecificEnabler(
        isItemFile,
        checkFileEnabled(uri, 'Item'),
        ScribeSubscriptionHandler.registry.item
    );
    isDroptableFile = fileSpecificEnabler(
        isDroptableFile,
        checkFileEnabled(uri, 'Droptable'),
        ScribeSubscriptionHandler.registry.droptable
    );
    isStatFile = fileSpecificEnabler(
        isStatFile,
        checkFileEnabled(uri, 'Stat'),
        ScribeSubscriptionHandler.registry.stat
    );
}

export enum FileType {
    NONE,
    METASKILL,
    MOB,
    ITEM,
    DROPTABLE,
    STAT,
}

export function checkFileType(uri: vscode.Uri): FileType {
    if (!checkMythicMobsFile(uri)) {
        return FileType.NONE;
    }

    if (checkFileEnabled(uri, 'Metaskill')) {
        return FileType.METASKILL;
    }
    if (checkFileEnabled(uri, 'Mob')) {
        return FileType.MOB;
    }
    if (checkFileEnabled(uri, 'Item')) {
        return FileType.ITEM;
    }
    // if (checkFileEnabled(document, 'Droptable')) {
    //     return FileType.DROPTABLE;
    // }
    if (checkFileEnabled(uri, 'Stat')) {
        return FileType.STAT;
    }
    return FileType.NONE;
}

export const FileTypeToSchema: { [key in FileType]: FileObjectMap | undefined } = {
    [FileType.METASKILL]: MetaskillFileObjects,
    [FileType.MOB]: MobFileObjects,
    [FileType.ITEM]: ItemFileObjects,
    [FileType.DROPTABLE]: DroptableFileObject,
    [FileType.STAT]: undefined,
    [FileType.NONE]: undefined,
};
