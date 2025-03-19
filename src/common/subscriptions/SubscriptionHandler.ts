import * as vscode from 'vscode';

import { keyAliases, TriggerType } from '../objectInfos';
import { triggerfileCompletionProvider } from '../completions/filecompletions/triggerfileCompletionProvider';
import { mechanicCompletionProvider } from '../completions/mechanicsCompletionProvider';
import {
    enableEmptyBracketsAutomaticRemoval,
    enableFileSpecificSuggestions,
    enableShortcuts,
} from '../utils/configutils';
import {
    attributeCompletionProvider,
    attributeValueCompletionProvider,
} from '../completions/attributeCompletionProvider';
import { conditionCompletionProvider } from '../completions/conditionsCompletionProvider';
import { inlineConditionCompletionProvider } from '../completions/inlineconditionCompletionProvider';
import {
    inlineMetaskillCompletionProvider,
    metaskillCompletionProvider,
} from '../completions/inlinemetaskillCompletionProvider';
import { mechaniclineCompletionProvider } from '../completions/mechaniclineCompletionProvider';
import { targeterCompletionProvider } from '../completions/targeterCompletionProvider';
import { hoverProvider } from '../cursorLocationActions/hoverprovider';
import { removeBracketsTextListener } from '../textchanges/bracketsremover';
import { shortcutsProvider } from '../textchanges/shortcuts';
import { ItemFileObjects } from '../schemas/itemfileObjects';
import { MobFileObjects } from '../schemas/mobFileObjects';
import { MetaskillFileObjects } from '../schemas/metaskillFileObjects';
import { ScribeMechanicHandler } from '../datasets/ScribeMechanic';
import { ctx } from '../../MythicScribe';
import { genericFileCompletionProvider } from '../completions/filecompletions/genericFileCompletionProvider';
import { DroptableFileObject } from '../schemas/droptableFileObjects';
import { StatFileObjects } from '../schemas/statfileObjects';
import { definitionProvider } from '../cursorLocationActions/definitionProvider';
import { placeholderCompletionProvider } from '../completions/placeholderCompletion';

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

    /**
     * Enables a subscription by adding it to the subscriptions list and the context's subscriptions.
     *
     * @param subscription - The subscription to be enabled and added to the lists.
     */
    enable(subscription: vscode.Disposable) {
        this.subscriptions.push(subscription);
        ctx.subscriptions.push(subscription);
    }

    /**
     * Enables all subscriptions by first disposing of all existing subscriptions,
     * then enabling all child subscription handlers, and finally enabling the
     * subscription functions if all enable conditions are met.
     *
     * @remarks
     * - This method first calls `disposeAll` to clear any existing subscriptions.
     * - It then iterates over `childSubscriptionHandlers` and calls `enableAll` on each handler.
     * - If all `enableConditions` return true, it iterates over `subscriptionFunctions`
     *   and calls `enable` on the result of each function.
     */
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

    /**
     * Disposes of all child subscription handlers and subscriptions.
     *
     * This method iterates over all child subscription handlers and calls their
     * `disposeAll` method to ensure they are properly disposed of. It then iterates
     * over all subscriptions and calls their `dispose` method to release any resources
     * they may be holding. Finally, it clears the subscriptions array.
     */
    disposeAll() {
        this.childSubscriptionHandlers.forEach((handler) => {
            handler.disposeAll();
        });

        if (this.subscriptions.length === 0) {
            return;
        }
        this.subscriptions.forEach((subscription) => {
            subscription.dispose();
        });

        this.subscriptions.length = 0;
    }

    /**
     * Adds one or more child subscription handlers to the current subscription handler.
     *
     * @param {...AbstractScribeSubscription[]} handler - The subscription handlers to be added.
     */
    addChildSubscriptionHandler(...handler: AbstractScribeSubscription[]) {
        this.childSubscriptionHandlers.push(...handler);
    }
}

class ItemScribeSubscription extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                () => genericFileCompletionProvider(ItemFileObjects),
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
                () => genericFileCompletionProvider(MobFileObjects),
                () =>
                    mechanicCompletionProvider(
                        ScribeMechanicHandler.registry.aitarget,
                        keyAliases.AITargetSelectors
                    ),
                () =>
                    mechanicCompletionProvider(
                        ScribeMechanicHandler.registry.aigoal,
                        keyAliases.AIGoalSelectors
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
                () => genericFileCompletionProvider(MetaskillFileObjects),
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
                        keyAliases.Skills
                    ),
                () => targeterCompletionProvider(),
                () => definitionProvider(),
                () => metaskillCompletionProvider(),
                () => placeholderCompletionProvider(),
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

class DroptableSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                () => genericFileCompletionProvider(DroptableFileObject),
                () =>
                    hoverProvider(DroptableFileObject, {
                        keys: keyAliases.DroptableConditions,
                        registry: ScribeMechanicHandler.registry.condition,
                    }),
                () => conditionCompletionProvider(),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class StatSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                () => genericFileCompletionProvider(StatFileObjects),
                () => hoverProvider(StatFileObjects),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class PlaceholderSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super([], []);
    }
}

export const ScribeSubscriptionHandler = {
    registry: {
        global: new GlobalSubscriptionHandler(),
        mob: new MobScribeSubscription(),
        metaskill: new SkillScribeSubscription(),
        item: new ItemScribeSubscription(),
        droptable: new DroptableSubscriptionHandler(),
        stat: new StatSubscriptionHandler(),
        placeholder: new PlaceholderSubscriptionHandler(),
    },

    disposeAll() {
        Object.values(this.registry).forEach((handler) => {
            handler.disposeAll();
        });
    },
};
