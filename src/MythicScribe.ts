import * as vscode from 'vscode';

import * as config from './utils/configutils';
import { getFormatter } from './formatter/formatter';
import { hoverProvider } from './hovers/hoverprovider';
import { inlineConditionCompletionProvider } from './completions/inlineconditionCompletionProvider';
import { mechanicCompletionProvider } from './completions/mechanicsCompletionProvider';
import { conditionCompletionProvider } from './completions/conditionsCompletionProvider';
import { targeterCompletionProvider } from './completions/targeterCompletionProvider';
import {
    attributeCompletionProvider,
    attributeValueCompletionProvider,
} from './completions/attributeCompletionProvider';
import { inlineMetaskillCompletionProvider } from './completions/inlinemetaskillCompletionProvider';
import { mechaniclineCompletionProvider } from './completions/mechaniclineCompletionProvider';
import { removeBracketsTextListener } from './textchanges/bracketsremover';
import { shortcutsProvider } from './textchanges/shortcuts';
import { loadDatasets } from './datasets/datasets';
import { metaskillFileCompletionProvider } from './completions/filecompletions/metaskillfileCompletionProvider';
import { mobFileCompletionProvider } from './completions/filecompletions/mobfileCompletionProvider';
import { itemFileCompletionProvider } from './completions/filecompletions/itemfileCompletionProvider';
import { addCustomDataset } from './datasets/customDatasets';
import { triggerfileCompletionProvider } from './completions/filecompletions/triggerfileCompletionProvider';
import { keyAliases, ObjectType, TriggerType } from './objectInfos';

export let ctx: vscode.ExtensionContext;

// Arrays to store all subscriptions
const gloabsubscriptions: vscode.Disposable[] = [];
const mobfilesubscriptions: vscode.Disposable[] = [];
const skillfilesubscriptions: vscode.Disposable[] = [];
const itemfilesubscriptions: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
    ctx = context;

    // Datasets
    loadDatasets(context);

    // Subscription Handler
    context.subscriptions.push(config.extensionEnabler);
    if (vscode.window.activeTextEditor) {
        config.updateEnabled(vscode.window.activeTextEditor.document);
    }

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('MythicScribe.addCustomDataset', addCustomDataset),
    );

    // Formatter
    context.subscriptions.push(getFormatter());
}

export function deactivate() {}

// Enable all basic subscriptions
export function enableSubscriptions() {
    const context = ctx;

    const toEnable = [
        attributeCompletionProvider(),
        attributeValueCompletionProvider(),
        conditionCompletionProvider(),
        inlineConditionCompletionProvider(),
        inlineMetaskillCompletionProvider(),
        mechaniclineCompletionProvider(),
        mechanicCompletionProvider(ObjectType.MECHANIC, keyAliases.Skills, ''),
        targeterCompletionProvider(),
        hoverProvider(),
    ];

    // Completions

    // Text Changes
    if (config.enableEmptyBracketsAutomaticRemoval()) {
        toEnable.push(removeBracketsTextListener());
    }

    if (config.enableShortcuts()) {
        toEnable.push(shortcutsProvider());
    }

    toEnable.forEach((subscription) => {
        context.subscriptions.push(subscription);
        gloabsubscriptions.push(subscription);
    });
}

// Disable all basic subscriptions
export function disableSubscriptions() {
    gloabsubscriptions.forEach((subscription) => {
        subscription.dispose();
    });
    gloabsubscriptions.length = 0;

    // File Specific
    disableSkillfileSubscriptions();
    disableMobfileSubscriptions();
    disableItemFileSubscriptions();
}

export function enableMobfileSubscriptions() {
    const context = ctx;
    const toEnable = [];

    if (config.enableFileSpecificSuggestions()) {
        toEnable.push(mobFileCompletionProvider());
        toEnable.push(triggerfileCompletionProvider(TriggerType.MOB));
        toEnable.push(
            mechanicCompletionProvider(
                ObjectType.AITARGET,
                keyAliases.AITargetSelectors,
                'WrappedPathfindingGoal',
            ),
        );
    }

    toEnable.forEach((subscription) => {
        context.subscriptions.push(subscription);
        mobfilesubscriptions.push(subscription);
    });
}

export function disableMobfileSubscriptions() {
    mobfilesubscriptions.forEach((subscription) => {
        subscription.dispose();
    });
    mobfilesubscriptions.length = 0;
}

// Enable all skillfile subscriptions
let reminder_disableAcceptSuggestionOnEnter = true;
export function enableSkillfileSubscriptions() {
    const context = ctx;
    const toEnable = [];

    if (config.enableFileSpecificSuggestions()) {
        const acceptOnEnter = vscode.workspace
            .getConfiguration('editor')
            .get('acceptSuggestionOnEnter');
        if (
            reminder_disableAcceptSuggestionOnEnter &&
            vscode.workspace
                .getConfiguration('MythicScribe')
                .get('disableAcceptSuggestionOnEnter') &&
            acceptOnEnter !== 'off'
        ) {
            reminder_disableAcceptSuggestionOnEnter = false;
            vscode.window
                .showInformationMessage(
                    '`Accept Completions on Enter` is enabled. Would you like to disable it?',
                    'Yes',
                    'No',
                    "Don't ask again",
                )
                .then((selection) => {
                    if (selection === 'Yes') {
                        vscode.workspace
                            .getConfiguration('editor')
                            .update(
                                'acceptSuggestionOnEnter',
                                'off',
                                vscode.ConfigurationTarget.Workspace,
                            );
                        toEnable.push(metaskillFileCompletionProvider());
                    } else if (selection === "Don't ask again") {
                        vscode.workspace
                            .getConfiguration('MythicScribe')
                            .update(
                                'disableAcceptSuggestionOnEnter',
                                false,
                                vscode.ConfigurationTarget.Workspace,
                            );
                    }
                    return;
                });
        } else {
            toEnable.push(metaskillFileCompletionProvider());
        }
    }

    toEnable.forEach((subscription) => {
        context.subscriptions.push(subscription);
        skillfilesubscriptions.push(subscription);
    });
}

// Disable all skillfile subscriptions
export function disableSkillfileSubscriptions() {
    skillfilesubscriptions.forEach((subscription) => {
        subscription.dispose();
    });
    skillfilesubscriptions.length = 0;
}

export function enableItemFileSubscriptions() {
    const context = ctx;
    const toEnable = [];

    if (config.enableFileSpecificSuggestions()) {
        toEnable.push(itemFileCompletionProvider());
        toEnable.push(triggerfileCompletionProvider(TriggerType.ITEM, ['Skills']));
        toEnable.push(triggerfileCompletionProvider(TriggerType.FURNITURE, ['FurnitureSkills']));
        toEnable.push(triggerfileCompletionProvider(TriggerType.BLOCK, ['CustomBlockSkills']));
    }

    toEnable.forEach((subscription) => {
        context.subscriptions.push(subscription);
        itemfilesubscriptions.push(subscription);
    });
}

export function disableItemFileSubscriptions() {
    itemfilesubscriptions.forEach((subscription) => {
        subscription.dispose();
    });
    itemfilesubscriptions.length = 0;
}
