import * as vscode from 'vscode';

import * as SubscriptionHelper from './common/subscriptions/SubscriptionHelper';
import { getFormatter } from './common/formatter/formatter';
import {
    addCustomDataset,
    createBundleDataset,
    removeCustomDataset,
} from './common/datasets/customDatasets';
import { doVersionSpecificMigrations } from './common/migration/migration';
import { ScribeLogger, openLogs, showInfoMessageWithOptions } from './common/utils/logger';
import {
    clearExtensionDatasetsClonedStorage,
    loadDatasets,
    setEdcsUri,
} from './common/datasets/datasets';
import { configHandler } from './common/utils/configutils';
import { scribeColorProvider } from './common/color/colorprovider';

export let ctx: vscode.ExtensionContext;

export async function activate(context: vscode.ExtensionContext) {
    ctx = context;
    ScribeLogger.debug('Extension Activated');

    setEdcsUri();

    // Check if the extension has been updated
    if (checkExtensionVersion()) {
        // Run migrations if so
        ScribeLogger.debug('Running migrations');
        await Promise.all([doVersionSpecificMigrations(), clearExtensionDatasetsClonedStorage()]);
    }

    loadDatasets();

    context.subscriptions.push(
        // Subscription Handler
        SubscriptionHelper.extensionEnabler,

        // Config Handler
        configHandler,

        // Commands
        vscode.commands.registerCommand('MythicScribe.addCustomDataset', addCustomDataset),
        vscode.commands.registerCommand('MythicScribe.removeCustomDataset', removeCustomDataset),
        vscode.commands.registerCommand('MythicScribe.createBundleDataset', createBundleDataset),
        vscode.commands.registerCommand('MythicScribe.openLogs', openLogs),
        vscode.commands.registerCommand('MythicScribe.loadDatasets', loadDatasets),

        // Formatter
        getFormatter(),

        // Color Provider
        vscode.languages.registerColorProvider('mythicscript', scribeColorProvider)
    );

    if (vscode.window.activeTextEditor) {
        SubscriptionHelper.updateSubscriptions(vscode.window.activeTextEditor.document);
    }
}

export function deactivate() {}

export function checkExtensionVersion(): boolean {
    const version = ctx.extension.packageJSON.version;
    const savedVersion = ctx.globalState.get<string>('extensionVersion');
    ScribeLogger.debug(`Current version: ${version}, Saved version: ${savedVersion}`);
    if (version && version !== savedVersion) {
        const checkExtensionVersionOptions: { [key: string]: string } = {
            'Check Changelogs': 'https://github.com/Lxlp38/MythicScribe/blob/master/CHANGELOG.md',
        };
        showInfoMessageWithOptions(
            `Updated MythicScribe to version ${version}`,
            checkExtensionVersionOptions
        );
        ctx.globalState.update('extensionVersion', version);
        return true;
    }
    return false;
}
