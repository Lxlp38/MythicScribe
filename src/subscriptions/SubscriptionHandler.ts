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
import { AbstractScribeHandler } from '../handlers/AbstractScribeHandler';

type SubscriptionFunction = () => vscode.Disposable;
type SubscriptionCondition = () => boolean;

export class ScribeSubscriptionHandler extends AbstractScribeHandler {
    static createInstance(): AbstractScribeHandler {
        return new ScribeSubscriptionHandler();
    }

    private constructor() {
        super();
        GlobalSubscriptionHandler.getInstance();
        MobScribeSubscription.getInstance();
        SkillScribeSubscription.getInstance();
        ItemScribeSubscription.getInstance();
    }

    static disposeAll() {
        GlobalSubscriptionHandler.getInstance<GlobalSubscriptionHandler>().disposeAll();
        MobScribeSubscription.getInstance<MobScribeSubscription>().disposeAll();
        SkillScribeSubscription.getInstance<SkillScribeSubscription>().disposeAll();
    }
}

export abstract class AbstractScribeSubscription extends AbstractScribeHandler {
    private subscriptions: vscode.Disposable[] = [];
    private subscriptionFunctions: SubscriptionFunction[] = [];
    private enableConditions: SubscriptionCondition[] = [];
    private childSubscriptionHandlers: AbstractScribeSubscription[] = [];

    constructor(
        subscriptionFunctions: SubscriptionFunction[],
        conditions: SubscriptionCondition[] = []
    ) {
        super();
        this.subscriptionFunctions = subscriptionFunctions;
        this.enableConditions = conditions;
    }

    enable(subscription: vscode.Disposable) {
        this.subscriptions.push(subscription);
        ScribeSubscriptionHandler.context.subscriptions.push(subscription);
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

    addChildSubscriptionHandler(...handler: AbstractScribeSubscription[]) {
        this.childSubscriptionHandlers.push(...handler);
    }
}

export class ItemScribeSubscription extends AbstractScribeSubscription {
    static createInstance(): ItemScribeSubscription {
        return new ItemScribeSubscription();
    }

    private constructor() {
        super(
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

export class MobScribeSubscription extends AbstractScribeSubscription {
    static createInstance(): MobScribeSubscription {
        return new MobScribeSubscription();
    }

    private constructor() {
        super(
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

export class SkillScribeSubscription extends AbstractScribeSubscription {
    static createInstance(): SkillScribeSubscription {
        return new SkillScribeSubscription();
    }

    private constructor() {
        super(
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

export class GlobalSubscriptionHandler extends AbstractScribeSubscription {
    static createInstance(): GlobalSubscriptionHandler {
        return new GlobalSubscriptionHandler();
    }

    private constructor() {
        super(
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
            ShortcutsSubscriptionHandler.getInstance(),
            TextChangesSubscriptionHandler.getInstance()
        );
    }
}

class TextChangesSubscriptionHandler extends AbstractScribeSubscription {
    static createInstance(): TextChangesSubscriptionHandler {
        return new TextChangesSubscriptionHandler();
    }

    private constructor() {
        super([() => removeBracketsTextListener()], [enableEmptyBracketsAutomaticRemoval]);
    }
}

class ShortcutsSubscriptionHandler extends AbstractScribeSubscription {
    static createInstance(): ShortcutsSubscriptionHandler {
        return new ShortcutsSubscriptionHandler();
    }

    private constructor() {
        super([() => shortcutsProvider()], [enableShortcuts]);
    }
}
