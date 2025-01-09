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
} from '../utils/configutils';
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
import { ItemFileObjects } from '../schemas/itemfileObjects';
import { MobFileObjects } from '../schemas/mobFileObjects';
import { MetaskillFileObjects } from '../schemas/metaskillFileObjects';

type SubscriptionFunction = () => vscode.Disposable;
type SubscriptionCondition = () => boolean;

export class ScribeSubscriptionMap {
    static instance: ScribeSubscriptionMap;
    static getInstance(context: vscode.ExtensionContext) {
        if (!ScribeSubscriptionMap.instance) {
            ScribeSubscriptionMap.instance = new ScribeSubscriptionMap(context);
        }
        return ScribeSubscriptionMap.instance;
    }

    public global: GlobalSubscriptionHandler;
    public mob: MobScribeSubscriptionHandler;
    public skill: SkillScribeSubscriptionHandler;
    public item: ItemScribeSubscriptionHandler;

    private constructor(context: vscode.ExtensionContext) {
        this.global = new GlobalSubscriptionHandler(context);
        this.mob = new MobScribeSubscriptionHandler(context);
        this.skill = new SkillScribeSubscriptionHandler(context);
        this.item = new ItemScribeSubscriptionHandler(context);
    }

    disposeAll() {
        this.global.disposeAll();
        this.mob.disposeAll();
        this.skill.disposeAll();
        this.item.disposeAll();
    }
}

export class ScribeSubscriptionHandler {
    private subscriptions: vscode.Disposable[] = [];
    private context: vscode.ExtensionContext;
    private subscriptionFunctions: SubscriptionFunction[] = [];
    private enableConditions: SubscriptionCondition[] = [];
    private childSubscriptionHandlers: ScribeSubscriptionHandler[] = [];

    constructor(
        context: vscode.ExtensionContext,
        subscriptionFunctions: SubscriptionFunction[],
        conditions: SubscriptionCondition[] = []
    ) {
        this.context = context;
        this.subscriptionFunctions = subscriptionFunctions;
        this.enableConditions = conditions;
    }

    enable(subscription: vscode.Disposable) {
        this.subscriptions.push(subscription);
        this.context.subscriptions.push(subscription);
    }

    enableAll() {
        this.disposeAll();

        this.childSubscriptionHandlers.forEach((handler) => {
            handler.enableAll();
        });

        if (this.enableConditions.every((condition) => condition())) {
            this.subscriptionFunctions.forEach((func) => {
                this.enable(func());
            });
        }
    }

    disposeAll() {
        this.childSubscriptionHandlers.forEach((handler) => {
            handler.disposeAll();
        });

        this.subscriptions.forEach((subscription) => {
            subscription.dispose();
        });

        this.subscriptions.length = 0;
    }

    addChildSubscriptionHandler(...handler: ScribeSubscriptionHandler[]) {
        this.childSubscriptionHandlers.push(...handler);
    }
}

class ItemScribeSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(
            context,
            [
                itemFileCompletionProvider,
                () => triggerfileCompletionProvider(TriggerType.ITEM, ['Skills']),
                () => triggerfileCompletionProvider(TriggerType.FURNITURE, ['FurnitureSkills']),
                () => triggerfileCompletionProvider(TriggerType.BLOCK, ['CustomBlockSkills']),
                () => hoverProvider(ItemFileObjects),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class MobScribeSubscriptionHandler extends ScribeSubscriptionHandler {
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
                () =>
                    hoverProvider(
                        MobFileObjects,
                        { keys: keyAliases.AIGoalSelectors, type: ObjectType.AIGOAL },
                        { keys: keyAliases.AITargetSelectors, type: ObjectType.AITARGET }
                    ),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class SkillScribeSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(
            context,
            [
                metaskillFileCompletionProvider,
                () => conditionCompletionProvider(),
                () =>
                    hoverProvider(MetaskillFileObjects, {
                        keys: keyAliases.Conditions,
                        type: ObjectType.CONDITION,
                    }),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class GlobalSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(
            context,
            [
                () => attributeCompletionProvider(),
                () => attributeValueCompletionProvider(),
                () => inlineConditionCompletionProvider(),
                () => inlineMetaskillCompletionProvider(),
                () => mechaniclineCompletionProvider(),
                () => mechanicCompletionProvider(ObjectType.MECHANIC, keyAliases.Skills, ''),
                () => targeterCompletionProvider(),
            ],
            []
        );

        this.addChildSubscriptionHandler(
            new ShortcutsSubscriptionHandler(context),
            new TextChangesSubscriptionHandler(context)
        );
    }
}

class TextChangesSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(context, [() => removeBracketsTextListener()], [enableEmptyBracketsAutomaticRemoval]);
    }
}

class ShortcutsSubscriptionHandler extends ScribeSubscriptionHandler {
    constructor(context: vscode.ExtensionContext) {
        super(context, [() => shortcutsProvider()], [enableShortcuts]);
    }
}
