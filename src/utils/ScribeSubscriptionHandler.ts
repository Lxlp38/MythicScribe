import * as vscode from 'vscode';

import { itemFileCompletionProvider } from '../completions/filecompletions/itemfileCompletionProvider';
import { keyAliases, ObjectType, TriggerType } from '../objectInfos';
import { triggerfileCompletionProvider } from '../completions/filecompletions/triggerfileCompletionProvider';
import { mobFileCompletionProvider } from '../completions/filecompletions/mobfileCompletionProvider';
import { mechanicCompletionProvider } from '../completions/mechanicsCompletionProvider';
import {
    enableEmptyBracketsAutomaticRemoval,
    enableFileSpecificSuggestions,
    enableShortcuts,
} from './configutils';
import { metaskillFileCompletionProvider } from '../completions/filecompletions/metaskillfileCompletionProvider';
import {
    attributeCompletionProvider,
    attributeValueCompletionProvider,
} from '../completions/attributeCompletionProvider';
import { conditionCompletionProvider } from '../completions/conditionsCompletionProvider';
import { inlineConditionCompletionProvider } from '../completions/inlineconditionCompletionProvider';
import { inlineMetaskillCompletionProvider } from '../completions/inlinemetaskillCompletionProvider';
import { mechaniclineCompletionProvider } from '../completions/mechaniclineCompletionProvider';
import { targeterCompletionProvider } from '../completions/targeterCompletionProvider';
import { hoverProvider } from '../hovers/hoverprovider';
import { removeBracketsTextListener } from '../textchanges/bracketsremover';
import { shortcutsProvider } from '../textchanges/shortcuts';

export enum FileSubscriptionType {
    GLOBAL = 'global',
    MOB = 'mob',
    SKILL = 'skill',
    ITEM = 'item',
    TEXT_CHANGES = 'text_changes',
    SHORTCUTS = 'shortcuts',
}

type SubscriptionFunction = () => vscode.Disposable;
type SubscriptionCondition = () => boolean;

export class ScribeSubscriptionHandler {
    private subscriptions: vscode.Disposable[] = [];
    private context: vscode.ExtensionContext;
    private functions: SubscriptionFunction[] = [];
    private enableConditions: SubscriptionCondition[] = [];

    constructor(
        context: vscode.ExtensionContext,
        functions: SubscriptionFunction[],
        conditions: SubscriptionCondition[] = []
    ) {
        this.context = context;
        this.functions = functions;
        this.enableConditions = conditions;
    }

    enable(subscription: vscode.Disposable) {
        this.subscriptions.push(subscription);
        this.context.subscriptions.push(subscription);
    }

    enableAll() {
        this.disposeAll();
        if (this.enableConditions.every((condition) => condition())) {
            this.functions.forEach((func) => {
                this.enable(func());
            });
        }
    }

    disposeAll() {
        this.subscriptions.forEach((subscription) => {
            subscription.dispose();
        });
        this.subscriptions.length = 0;
    }
}

export class ItemScribeSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(
            context,
            [
                itemFileCompletionProvider,
                () => triggerfileCompletionProvider(TriggerType.ITEM, ['Skills']),
                () => triggerfileCompletionProvider(TriggerType.FURNITURE, ['FurnitureSkills']),
                () => triggerfileCompletionProvider(TriggerType.BLOCK, ['CustomBlockSkills']),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

export class MobScribeSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(
            context,
            [
                () => triggerfileCompletionProvider(TriggerType.MOB, ['Skills']),
                () => mobFileCompletionProvider(),
                () =>
                    mechanicCompletionProvider(
                        ObjectType.AITARGET,
                        keyAliases.AITargetSelectors,
                        'WrappedPathfindingGoal'
                    ),
                () =>
                    mechanicCompletionProvider(
                        ObjectType.AIGOAL,
                        keyAliases.AIGoalSelectors,
                        'WrappedPathfindingGoal'
                    ),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

export class SkillScribeSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(context, [metaskillFileCompletionProvider], [enableFileSpecificSuggestions]);
    }
}

export class GlobalSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(
            context,
            [
                () => attributeCompletionProvider(),
                () => attributeValueCompletionProvider(),
                () => conditionCompletionProvider(),
                () => inlineConditionCompletionProvider(),
                () => inlineMetaskillCompletionProvider(),
                () => mechaniclineCompletionProvider(),
                () => mechanicCompletionProvider(ObjectType.MECHANIC, keyAliases.Skills, ''),
                () => targeterCompletionProvider(),
                () => hoverProvider(),
            ],
            []
        );
    }
}

export class TextChangesSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(context, [() => removeBracketsTextListener()], [enableEmptyBracketsAutomaticRemoval]);
    }
}

export class ShortcutsSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(context, [() => shortcutsProvider()], [enableShortcuts]);
    }
}
