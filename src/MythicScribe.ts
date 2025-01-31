import * as vscode from 'vscode';

import * as SubscriptionHelper from './subscriptions/SubscriptionHelper';
import { getFormatter } from './formatter/formatter';
import { addCustomDataset } from './datasets/customDatasets';
import { ScribeMechanicHandler } from './datasets/ScribeMechanic';
import { ScribeEnumHandler } from './datasets/ScribeEnum';
import { migrate } from './migration/migration';
import { logInfo } from './utils/logger';

export let ctx: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
    ctx = context;

    checkExtensionVersion();

    ScribeEnumHandler.initializeEnums();
    ScribeMechanicHandler.loadDatasets();

    // Datasets
    context.subscriptions.push(
        // Subscription Handler
        SubscriptionHelper.extensionEnabler,

        // Commands
        vscode.commands.registerCommand('MythicScribe.addCustomDataset', addCustomDataset),

        // Formatter
        getFormatter()
    );

    if (vscode.window.activeTextEditor) {
        SubscriptionHelper.updateEnabled(vscode.window.activeTextEditor.document);
    }
}

export function deactivate() {}

export function checkExtensionVersion() {
    const version = vscode.extensions.getExtension('lxlp.mythicscribe')?.packageJSON.version;
    const savedVersion = ctx.globalState.get<string>('extensionVersion');
    if (version && version !== savedVersion) {
        logInfo(`Updated MythicScribe to version ${version}`);
        ctx.globalState.update('extensionVersion', version);
        migrate();
    }
}
