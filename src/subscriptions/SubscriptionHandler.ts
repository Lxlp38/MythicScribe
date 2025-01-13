import * as vscode from 'vscode';

import { itemFileCompletionProvider } from '../completions/filecompletions/itemfileCompletionProvider';
import { keyAliases, TriggerType } from '../objectInfos';
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
import { ScribeMechanicHandler } from '../datasets/ScribeMechanic';
import { ctx } from '../MythicScribe';

type SubscriptionFunction = () => vscode.Disposable;
type SubscriptionCondition = () => boolean;

export abstract class AbstractScribeSubscription {
    private subscriptions: vscode.Disposable[] = [];
    private subscriptionFunctions: SubscriptionFunction[] = [];
    private enableConditions: SubscriptionCondition[] = [];
    private childSubscriptionHandlers: AbstractScribeSubscription[] = [];

    constructor(
        subscriptionFunctions: SubscriptionFunction[],
        conditions: SubscriptionCondition[] = []
    ) {
        this.subscriptionFunctions = subscriptionFunctions;
        this.enableConditions = conditions;
    }

    enable(subscription: vscode.Disposable) {
        this.subscriptions.push(subscription);
        ctx.subscriptions.push(subscription);
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

class ItemScribeSubscription extends AbstractScribeSubscription {
    constructor() {
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

class MobScribeSubscription extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                () => triggerfileCompletionProvider(TriggerType.MOB, ['Skills']),
                () => mobFileCompletionProvider(),
                () =>
                    mechanicCompletionProvider(
                        ScribeMechanicHandler.registry.aitarget,
                        keyAliases.AITargetSelectors,
                        'WrappedPathfindingGoal'
                    ),
                () =>
                    mechanicCompletionProvider(
                        ScribeMechanicHandler.registry.aigoal,
                        keyAliases.AIGoalSelectors,
                        'WrappedPathfindingGoal'
                    ),
                () =>
                    hoverProvider(
                        MobFileObjects,
                        {
                            keys: keyAliases.AIGoalSelectors,
                            registry: ScribeMechanicHandler.registry.aigoal,
                        },
                        {
                            keys: keyAliases.AITargetSelectors,
                            registry: ScribeMechanicHandler.registry.aitarget,
                        }
                    ),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class SkillScribeSubscription extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                metaskillFileCompletionProvider,
                () => conditionCompletionProvider(),
                () =>
                    hoverProvider(MetaskillFileObjects, {
                        keys: keyAliases.Conditions,
                        registry: ScribeMechanicHandler.registry.condition,
                    }),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class GlobalSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                () => attributeCompletionProvider(),
                () => attributeValueCompletionProvider(),
                () => inlineConditionCompletionProvider(),
                () => inlineMetaskillCompletionProvider(),
                () => mechaniclineCompletionProvider(),
                () =>
                    mechanicCompletionProvider(
                        ScribeMechanicHandler.registry.mechanic,
                        keyAliases.Skills,
                        ''
                    ),
                () => targeterCompletionProvider(),
            ],
            []
        );

        this.addChildSubscriptionHandler(
            new ShortcutsSubscriptionHandler(),
            new TextChangesSubscriptionHandler()
        );
    }
}

class TextChangesSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super([() => removeBracketsTextListener()], [enableEmptyBracketsAutomaticRemoval]);
    }
}

class ShortcutsSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super([() => shortcutsProvider()], [enableShortcuts]);
    }
}

export const ScribeSubscriptionHandler = {
    registry: {
        global: new GlobalSubscriptionHandler(),
        mob: new MobScribeSubscription(),
        skill: new SkillScribeSubscription(),
        item: new ItemScribeSubscription(),
    },

    disposeAll() {
        Object.values(this.registry).forEach((handler) => {
            handler.disposeAll();
        });
    },
};
