import * as vscode from 'vscode';
import { openAuraFXWebview } from '@common/webviews/views/aurafx';
import { openMinecraftSoundsWebview } from '@common/webviews/views/minecraftsounds';
import { scribeCodeLensProvider } from '@common/providers/codeLensProvider';

import * as SubscriptionHelper from './common/subscriptions/SubscriptionHelper';
import { getFormatter } from './common/formatter/formatter';
import {
    addCustomDataset,
    createBundleDataset,
    removeCustomDataset,
} from './common/datasets/customDatasets';
import { doVersionSpecificMigrations } from './common/migration/migration';
import { getLogger, openLogs, showInfoMessageWithOptions } from './common/providers/loggerProvider';
import {
    clearExtensionDatasetsClonedStorage,
    loadDatasets,
    setEdcsUri,
} from './common/datasets/datasets';
import { scribeColorProvider } from './common/color/colorprovider';
import { showNodeGraph } from './common/mythicnodes/nodeView';
import { putSelectionInsideInlineMetaskill } from './common/completions/component/inlinemetaskillCompletionProvider';

export let ctx: vscode.ExtensionContext | undefined = undefined;

let activationFunctionCallbacks: ((context: vscode.ExtensionContext) => void)[] | undefined;
function getActivationFunctionCallbacks() {
    if (activationFunctionCallbacks === undefined) {
        activationFunctionCallbacks = [];
    }
    return activationFunctionCallbacks;
}
export function executeFunctionAfterActivation(
    callback: (context: vscode.ExtensionContext) => void
): void {
    if (ctx) {
        callback(ctx);
    } else {
        getActivationFunctionCallbacks().push(callback);
    }
}

export async function activate(context: vscode.ExtensionContext) {
    ctx = context;
    getLogger().debug('Extension Activated');

    for (const callback of getActivationFunctionCallbacks()) {
        try {
            callback(context);
        } catch (error) {
            getLogger().error(error, 'Error executing activation callback function:');
        }
    }

    setEdcsUri();

    // Check if the extension has been updated
    if (checkExtensionVersion()) {
        // Run migrations if so
        getLogger().debug('Running migrations');
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

        vscode.commands.registerCommand('MythicScribe.external.aurafx', () => openAuraFXWebview()),
        vscode.commands.registerCommand('MythicScribe.external.minecraftsounds', () =>
            openMinecraftSoundsWebview()
        ),
        vscode.commands.registerCommand(
            'MythicScribe.external.minecraftsounds.playback',
            openMinecraftSoundsWebview
        ),

        // Formatter
        getFormatter(),

        // Color Provider
        vscode.languages.registerColorProvider('mythicscript', scribeColorProvider),

        // CodeLens Provider
        vscode.languages.registerCodeLensProvider(
            { scheme: 'file', language: 'mythicscript' },
            scribeCodeLensProvider
        )
    );

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        SubscriptionHelper.updateSubscriptions(activeEditor.document);
    }
}

export function deactivate() {}

export function checkExtensionVersion(): boolean {
    const version = ctx!.extension.packageJSON.version;
    const savedVersion = ctx!.globalState.get<string>('extensionVersion');
    getLogger().debug(`Current version: ${version}, Saved version: ${savedVersion}`);
    if (version && version !== savedVersion) {
        const checkExtensionVersionOptions: Parameters<typeof showInfoMessageWithOptions>[1] = {
            'Check Changelogs': {
                target: 'https://github.com/Lxlp38/MythicScribe/blob/master/CHANGEgetLogger().md',
                type: 'external',
            },
        };
        showInfoMessageWithOptions(
            `Updated MythicScribe to version ${version}\nYou may need to restart VSCode for changes to take effect`,
            checkExtensionVersionOptions
        );
        ctx!.globalState.update('extensionVersion', version);
        return true;
    }
    return false;
}
