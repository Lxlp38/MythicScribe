import * as vscode from 'vscode';

import {
    checkMythicMobsFile,
    enableMythicScriptSyntax,
    checkFileEnabled,
    fileRegexProperties,
} from '../utils/configutils';
import { AbstractScribeSubscription, ScribeSubscriptionHandler } from './SubscriptionHandler';

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
    updateEnabled(editor.document);
});

export async function checkIfMythicScriptFile(document: vscode.TextDocument) {
    if (document.languageId !== 'yaml') {
        return;
    }
    if (checkMythicMobsFile(document)) {
        vscode.languages.setTextDocumentLanguage(document, 'mythicscript');
    }
}
// Updates the enabled features

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

export function updateEnabled(document: vscode.TextDocument) {
    if (enableMythicScriptSyntax()) {
        checkIfMythicScriptFile(document);
    }

    if (isEnabled !== checkMythicMobsFile(document)) {
        isEnabled = checkMythicMobsFile(document);
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
        checkFileEnabled(document, fileRegexProperties.METASKILL),
        ScribeSubscriptionHandler.registry.skill
    );
    isMobFile = fileSpecificEnabler(
        isMobFile,
        checkFileEnabled(document, fileRegexProperties.MOB),
        ScribeSubscriptionHandler.registry.mob
    );
    isItemFile = fileSpecificEnabler(
        isItemFile,
        checkFileEnabled(document, fileRegexProperties.ITEM),
        ScribeSubscriptionHandler.registry.item
    );
    isDroptableFile = fileSpecificEnabler(
        isDroptableFile,
        checkFileEnabled(document, fileRegexProperties.DROPTABLE),
        ScribeSubscriptionHandler.registry.droptable
    );
    isStatFile = fileSpecificEnabler(
        isStatFile,
        checkFileEnabled(document, fileRegexProperties.STAT),
        ScribeSubscriptionHandler.registry.stat
    );
}
