import { globalCallbacks } from '@common/providers/callbackProvider';
import * as vscode from 'vscode';
import { openAuraFXWebview } from '@common/webviews/views/aurafx';
import { openMinecraftSoundsWebview } from '@common/webviews/views/minecraftsounds';
import { scribeCodeLensProvider } from '@common/providers/codeLensProvider';
import { createDocumentationFromSkillParameters } from '@common/mythicnodes/comment-parser/comment-parser';
import { ConfigProvider } from '@common/providers/configProvider';
import { setEdcsUri } from '@common/datasets/edcsUri';
import { nodeDecorations } from '@common/mythicnodes/utils/NodeDecorations';
import { loadNodeEvents } from '@common/mythicnodes/utils/NodeEvents';
import { getScribeEnumHandler } from '@common/datasets/ScribeEnum';
import { MobSchemaMobVariablesFunction } from '@common/schemas/mobSchema';
import { getMobVariables } from '@common/schemas/actions/getMobVariables';

import * as SubscriptionHelper from './common/subscriptions/SubscriptionHelper';
import { getFormatter } from './common/formatter/formatter';
import { doVersionSpecificMigrations } from './common/migration/migration';
import { getLogger, openLogs, showInfoMessageWithOptions } from './common/providers/loggerProvider';
import {
    clearExtensionDatasetsClonedStorage,
    CustomDatasetsHandling,
    loadDatasets,
} from './common/datasets/datasets';
import { scribeColorProvider } from './common/color/colorprovider';
import { showNodeGraph } from './common/mythicnodes/nodeView';
import { putSelectionInsideInlineMetaskill } from './common/completions/component/inlinemetaskillCompletionProvider';

export async function activate(context: vscode.ExtensionContext) {
    const logger = getLogger();

    logger.debug('Extension Activated');
    logger.addScribeLogLevelProvider(() => ConfigProvider.registry.generic.get('logLevel'));
    logger.addConfigCallbackProvider(ConfigProvider.registry.generic);
    logger.updateLogLevel();

    ConfigProvider.addContextSubscriptions(context);

    const enumHandler = getScribeEnumHandler();
    enumHandler.setContext(context);

    nodeDecorations.addContext(context);
    loadNodeEvents(context);

    MobSchemaMobVariablesFunction.value = getMobVariables;

    // Run pre-activation callbacks
    globalCallbacks.activation.runCallbacks('pre-activation', context);

    setEdcsUri(context);

    // Check if the extension has been updated
    if (checkExtensionVersion(context)) {
        // Run migrations if so
        getLogger().debug('Running migrations');
        await Promise.all([
            clearExtensionDatasetsClonedStorage(),
            doVersionSpecificMigrations(vscode.ConfigurationTarget.Global),
        ]);
    }
    await doVersionSpecificMigrations(vscode.ConfigurationTarget.Workspace);

    loadDatasets(context);

    context.subscriptions.push(
        // Subscription Handler
        SubscriptionHelper.extensionEnabler(context),

        // Commands
        vscode.commands.registerCommand('MythicScribe.addCustomDataset', () =>
            CustomDatasetsHandling.handleAddCustomDataset(context)
        ),
        vscode.commands.registerCommand('MythicScribe.removeCustomDataset', () =>
            CustomDatasetsHandling.handleRemoveCustomDataset(context)
        ),
        vscode.commands.registerCommand('MythicScribe.createBundleDataset', () =>
            CustomDatasetsHandling.handleCreateBundleDataset(context)
        ),
        vscode.commands.registerCommand('MythicScribe.openLogs', openLogs),
        vscode.commands.registerCommand('MythicScribe.loadDatasets', loadDatasets),
        vscode.commands.registerCommand('MythicScribe.showNodeGraph', () => showNodeGraph(context)),
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
        vscode.commands.registerCommand(
            'MythicScribe.createMetaskillDocumentation',
            createDocumentationFromSkillParameters
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
        SubscriptionHelper.updateSubscriptions(activeEditor.document, context);
    }

    // Run post-activation callbacks
    globalCallbacks.activation.runCallbacks('post-activation', context);
}

export function deactivate() {}

export function checkExtensionVersion(context: vscode.ExtensionContext): boolean {
    const version = context.extension.packageJSON.version;
    const savedVersion = context.globalState.get<string>('extensionVersion');
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
        context.globalState.update('extensionVersion', version);
        return true;
    }
    return false;
}
