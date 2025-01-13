import * as vscode from 'vscode';

import * as resetFileChecks from './subscriptions/SubscriptionHelper';
import { getFormatter } from './formatter/formatter';
import { addCustomDataset } from './datasets/customDatasets';
import { ScribeMechanicHandler } from './datasets/ScribeMechanic';
import { ScribeEnumHandler } from './datasets/ScribeEnum';

export let ctx: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
    ctx = context;

    ScribeEnumHandler.initializeEnums();
    ScribeMechanicHandler.loadDatasets();

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
