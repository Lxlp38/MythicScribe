import * as vscode from 'vscode';

import * as SubscriptionHelper from './common/subscriptions/SubscriptionHelper';
import { getFormatter } from './common/formatter/formatter';
import {
    addCustomDataset,
    createBundleDataset,
    removeCustomDataset,
} from './common/datasets/customDatasets';
import { doVersionSpecificMigrations } from './common/migration/migration';
import Log, { openLogs, showInfoMessageWithOptions } from './common/utils/logger';
import {
    clearExtensionDatasetsClonedStorage,
    loadDatasets,
    setEdcsUri,
} from './common/datasets/datasets';
import { configHandler } from './common/utils/configutils';
import { scribeColorProvider } from './common/color/colorprovider';
import { showNodeGraph } from './common/mythicnodes/nodeView';
import { putSelectionInsideInlineMetaskill } from './common/completions/component/inlinemetaskillCompletionProvider';

export let ctx: vscode.ExtensionContext;

export async function activate(context: vscode.ExtensionContext) {
    ctx = context;
    Log.debug('Extension Activated');

    setEdcsUri();

    // Check if the extension has been updated
    if (checkExtensionVersion()) {
        // Run migrations if so
        Log.debug('Running migrations');
        await Promise.all([
            clearExtensionDatasetsClonedStorage(),
            doVersionSpecificMigrations(vscode.ConfigurationTarget.Global),
        ]);
    }
    await doVersionSpecificMigrations(vscode.ConfigurationTarget.Workspace);

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
        vscode.commands.registerCommand('MythicScribe.showNodeGraph', showNodeGraph),
        vscode.commands.registerCommand(
            'MythicScribe.putSelectionInsideInlineMetaskill',
            putSelectionInsideInlineMetaskill
        ),
        vscode.commands.registerCommand('MythicScribe.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'MythicScribe');
        }),

        // Formatter
        getFormatter(),

        // Color Provider
        vscode.languages.registerColorProvider('mythicscript', scribeColorProvider)
    );

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        SubscriptionHelper.updateSubscriptions(activeEditor.document);
    }
}

export function deactivate() {}

export function checkExtensionVersion(): boolean {
    const version = ctx.extension.packageJSON.version;
    const savedVersion = ctx.globalState.get<string>('extensionVersion');
    Log.debug(`Current version: ${version}, Saved version: ${savedVersion}`);
    if (version && version !== savedVersion) {
        const checkExtensionVersionOptions: { [key: string]: string } = {
            'Check Changelogs': 'https://github.com/Lxlp38/MythicScribe/blob/master/CHANGELOG.md',
        };
        showInfoMessageWithOptions(
            `Updated MythicScribe to version ${version}\nYou may need to restart VSCode for changes to take effect`,
            checkExtensionVersionOptions
        );
        ctx.globalState.update('extensionVersion', version);
        return true;
    }
    return false;
}
