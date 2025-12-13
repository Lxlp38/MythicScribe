import * as vscode from 'vscode';
import { getLogger } from '@common/providers/loggerProvider';

import { AbstractScribeSubscription, ScribeSubscriptionHandler } from './SubscriptionHandler';
import { checkMythicMobsFile, checkFileEnabled, ConfigProvider } from '../providers/configProvider';
import { FileTypeInfoMap } from '../FileTypeInfoMap';
import { ActiveFileTypeInfo } from './ActiveFileTypeInfo';

function resetFileChecks() {
    for (const key of Object.keys(ActiveFileTypeInfo) as (keyof typeof ActiveFileTypeInfo)[]) {
        ActiveFileTypeInfo[key] = false;
    }
}

export function extensionEnabler(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.onDidChangeActiveTextEditor((editor) => {
        getLogger().trace('MythicScribe active editor changed');
        if (!editor) {
            disableAllSubscriptions();
            return;
        }
        updateSubscriptions(editor.document, context);
    });
}

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
function fileSpecificEnabler({
    flag,
    newflagvalue,
    handler,
    context,
}: {
    flag: boolean;
    newflagvalue: boolean;
    handler: AbstractScribeSubscription;
    context: vscode.ExtensionContext;
}): boolean {
    if (flag !== newflagvalue) {
        if (newflagvalue) {
            handler.enableAll(context);
        } else {
            handler.disposeAll();
        }
    }
    return newflagvalue;
}

function disableAllSubscriptions() {
    ScribeSubscriptionHandler.disposeAll();
    resetFileChecks();
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
export function updateSubscriptions(
    document: vscode.TextDocument,
    context: vscode.ExtensionContext
) {
    if (ConfigProvider.registry.generic.get('enableMythicScriptSyntax')) {
        checkIfMythicScriptFile(document);
    }
    const uri = document.uri;

    const isMythicFile = checkMythicMobsFile(uri);
    if (ActiveFileTypeInfo.enabled !== isMythicFile) {
        ActiveFileTypeInfo.enabled = isMythicFile;
        if (ActiveFileTypeInfo.enabled) {
            ScribeSubscriptionHandler.registry.global.enableAll(context);
        } else {
            disableAllSubscriptions();
            return;
        }
    }

    // Don't check other things if the extension is disabled to begin with
    if (!ActiveFileTypeInfo.enabled) {
        return;
    }

    for (const info of Object.values(FileTypeInfoMap)) {
        ActiveFileTypeInfo[info.key] = fileSpecificEnabler({
            flag: ActiveFileTypeInfo[info.key],
            newflagvalue: checkFileEnabled(uri, info.configKey),
            handler: ScribeSubscriptionHandler.registry[info.key],
            context,
        });
    }
}
