import * as vscode from 'vscode';

import * as resetFileChecks from './subscriptions/SubscriptionHelper';
import { getFormatter } from './formatter/formatter';
import { addCustomDataset } from './datasets/customDatasets';
import { ScribeSubscriptionHandler } from './subscriptions/SubscriptionHandler';
import { ScribeEnumHandler } from './datasets/ScribeEnum';
import { AbstractScribeHandler } from './handlers/AbstractScribeHandler';
import { ScribeMechanicHandler } from './datasets/ScribeMechanic';

export let ctx: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
    ctx = context;

    AbstractScribeHandler.context = context;

    ScribeSubscriptionHandler.getInstance();
    ScribeEnumHandler.getInstance();
    ScribeMechanicHandler.getInstance();

    // Datasets
    context.subscriptions.push(
        // Subscription Handler
        resetFileChecks.extensionEnabler,

        // Commands
        vscode.commands.registerCommand('MythicScribe.addCustomDataset', addCustomDataset),

        // Formatter
        getFormatter()
    );

    if (vscode.window.activeTextEditor) {
        resetFileChecks.updateEnabled(vscode.window.activeTextEditor.document);
    }
}

export function deactivate() {}
