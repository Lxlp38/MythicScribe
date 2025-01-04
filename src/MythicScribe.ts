import * as vscode from 'vscode';

import * as config from './utils/configutils';
import { getFormatter } from './formatter/formatter';
import { loadDatasets } from './datasets/datasets';
import { addCustomDataset } from './datasets/customDatasets';
import {
    FileSubscriptionType,
    GlobalSubscriptionHandler,
    ItemScribeSubscriptionHandler,
    MobScribeSubscriptionHandler,
    ScribeSubscriptionHandler,
    ShortcutsSubscriptionHandler,
    SkillScribeSubscriptionHandler,
    TextChangesSubscriptionHandler,
} from './utils/ScribeSubscriptionHandler';

export let ctx: vscode.ExtensionContext;

export const subscriptionsMap: { [key: string]: ScribeSubscriptionHandler } = {};

export function activate(context: vscode.ExtensionContext) {
    ctx = context;

    subscriptionsMap[FileSubscriptionType.GLOBAL] = new GlobalSubscriptionHandler(context);
    subscriptionsMap[FileSubscriptionType.SKILL] = new SkillScribeSubscriptionHandler(context);
    subscriptionsMap[FileSubscriptionType.ITEM] = new ItemScribeSubscriptionHandler(context);
    subscriptionsMap[FileSubscriptionType.MOB] = new MobScribeSubscriptionHandler(context);
    subscriptionsMap[FileSubscriptionType.TEXT_CHANGES] = new TextChangesSubscriptionHandler(
        context
    );
    subscriptionsMap[FileSubscriptionType.SHORTCUTS] = new ShortcutsSubscriptionHandler(context);

    // Datasets
    loadDatasets(context);

    context.subscriptions.push(
        // Subscription Handler
        config.extensionEnabler,

        // Commands
        vscode.commands.registerCommand('MythicScribe.addCustomDataset', addCustomDataset),

        // Formatter
        getFormatter()
    );

    if (vscode.window.activeTextEditor) {
        config.updateEnabled(vscode.window.activeTextEditor.document);
    }
}

export function deactivate() {}
