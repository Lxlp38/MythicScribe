import * as vscode from 'vscode';

import {
    checkEnabled,
    enableMythicScriptSyntax,
    checkMetaskillFile,
    checkMobFile,
    checkItemFile,
} from '../utils/configutils';
import { ScribeSubscriptionHandler, ScribeSubscriptionMap } from './SubscriptionHandler';

function resetFileChecks() {
    isEnabled = false;
    isMetaskillFile = false;
    isMobFile = false;
    isItemFile = false;
}
export let isEnabled = false;
export let isMetaskillFile = false;
export let isMobFile = false;
export let isItemFile = false;

export const extensionEnabler = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor) {
        return;
    }
    const document = editor.document;
    updateEnabled(document);
});

export async function checkIfMythicScriptFile(document: vscode.TextDocument) {
    if (document.languageId !== 'yaml') {
        return;
    }
    if (checkEnabled(document)) {
        vscode.languages.setTextDocumentLanguage(document, 'mythicscript');
    }
}
// Updates the enabled features

function fileSpecificEnabler(
    flag: boolean,
    newflagvalue: boolean,
    handler: ScribeSubscriptionHandler
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

    if (isEnabled !== checkEnabled(document)) {
        isEnabled = checkEnabled(document);
        if (isEnabled) {
            ScribeSubscriptionMap.instance.global.enableAll();
        } else {
            ScribeSubscriptionMap.instance.disposeAll();
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
        checkMetaskillFile(document),
        ScribeSubscriptionMap.instance.skill
    );
    isMobFile = fileSpecificEnabler(
        isMobFile,
        checkMobFile(document),
        ScribeSubscriptionMap.instance.mob
    );
    isItemFile = fileSpecificEnabler(
        isItemFile,
        checkItemFile(document),
        ScribeSubscriptionMap.instance.item
    );
}
