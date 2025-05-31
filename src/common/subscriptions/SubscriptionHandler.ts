import * as vscode from 'vscode';
import { RandomSpawnSchema } from '@common/schemas/randomSpawnSchema';
import { ReagentSchema } from '@common/schemas/reagentSchema';
import { ArchetypeSchema } from '@common/schemas/archetypeSchema';
import { MenuSchema } from '@common/schemas/menuSchema';
import { AchievementSchema } from '@common/schemas/achievementSchema';
import { PlaceholderSchema } from '@common/schemas/placeholderSchema';

import { keyAliases, registryKey, TriggerType } from '../objectInfos';
import { triggerfileCompletionProvider } from '../completions/file/triggerfileCompletionProvider';
import { mechanicCompletionProvider } from '../completions/component/mechanicsCompletionProvider';
import {
    enableEmptyBracketsAutomaticRemoval,
    enableFileSpecificSuggestions,
    enableShortcuts,
} from '../utils/configutils';
import {
    attributeCompletionProvider,
    attributeValueCompletionProvider,
} from '../completions/component/attributeCompletionProvider';
import { conditionCompletionProvider } from '../completions/component/conditionsCompletionProvider';
import { inlineConditionCompletionProvider } from '../completions/component/inlineconditionCompletionProvider';
import {
    inlineMetaskillCompletionProvider,
    metaskillCompletionProvider,
} from '../completions/component/inlinemetaskillCompletionProvider';
import { mechaniclineCompletionProvider } from '../completions/component/mechaniclineCompletionProvider';
import { targeterCompletionProvider } from '../completions/component/targeterCompletionProvider';
import { hoverProvider } from '../cursorLocationActions/providers/hoverprovider';
import { removeBracketsTextListener } from '../textchanges/bracketsremover';
import { shortcutsProvider } from '../textchanges/shortcuts';
import { ItemSchema } from '../schemas/itemSchema';
import { MobSchema } from '../schemas/mobSchema';
import { MetaskillSchema } from '../schemas/metaskillSchema';
import { ScribeMechanicHandler } from '../datasets/ScribeMechanic';
import { ctx } from '../../MythicScribe';
import { genericFileCompletionProvider } from '../completions/file/genericFileCompletionProvider';
import { DroptableSchema } from '../schemas/droptableSchema';
import { StatSchema } from '../schemas/statSchema';
import { definitionProvider } from '../cursorLocationActions/providers/definitionProvider';
import { placeholderCompletionProvider } from '../completions/component/placeholderCompletion';

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
                () => genericFileCompletionProvider(ItemSchema),
                () => triggerfileCompletionProvider(TriggerType.ITEM, ['Skills']),
                () => triggerfileCompletionProvider(TriggerType.FURNITURE, ['FurnitureSkills']),
                () => triggerfileCompletionProvider(TriggerType.BLOCK, ['CustomBlockSkills']),
                () => conditionCompletionProvider(['EquipConditions']),
                () =>
                    hoverProvider(ItemSchema, {
                        keys: ['EquipConditions'],
                        registry: ScribeMechanicHandler.registry.condition,
                    }),
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
                () => genericFileCompletionProvider(MobSchema),
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
                        MobSchema,
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
                () => genericFileCompletionProvider(MetaskillSchema),
                () => conditionCompletionProvider(),
                () =>
                    hoverProvider(MetaskillSchema, {
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
                () => genericFileCompletionProvider(DroptableSchema),
                () =>
                    hoverProvider(DroptableSchema, {
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
            [() => genericFileCompletionProvider(StatSchema), () => hoverProvider(StatSchema)],
            [enableFileSpecificSuggestions]
        );
    }
}

class PinSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super([], []);
    }
}

class PlaceholderSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                () => genericFileCompletionProvider(PlaceholderSchema),
                () =>
                    hoverProvider(PlaceholderSchema, {
                        keys: ['Conditions'],
                        registry: ScribeMechanicHandler.registry.condition,
                    }),
                () => conditionCompletionProvider(['Conditions']),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class RandomSpawnSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                () => genericFileCompletionProvider(RandomSpawnSchema),
                () =>
                    hoverProvider(RandomSpawnSchema, {
                        keys: ['Conditions'],
                        registry: ScribeMechanicHandler.registry.condition,
                    }),
                () => conditionCompletionProvider(),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class ArchetypeSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                () => genericFileCompletionProvider(ArchetypeSchema),
                () => hoverProvider(ArchetypeSchema),
                () => triggerfileCompletionProvider(TriggerType.ARCHETYPE, ['Skills']),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class ReagentSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                () => genericFileCompletionProvider(ReagentSchema),
                () => hoverProvider(ReagentSchema),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

class MenuSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super(
            [() => genericFileCompletionProvider(MenuSchema), () => hoverProvider(MenuSchema)],
            [enableFileSpecificSuggestions]
        );
    }
}

class AchievementSubscriptionHandler extends AbstractScribeSubscription {
    constructor() {
        super(
            [
                () => genericFileCompletionProvider(AchievementSchema),
                () =>
                    hoverProvider(AchievementSchema, {
                        keys: keyAliases.Conditions,
                        registry: ScribeMechanicHandler.registry.condition,
                    }),
                () => conditionCompletionProvider(['Conditions']),
            ],
            [enableFileSpecificSuggestions]
        );
    }
}

interface ScribeSubscriptionHandler {
    registry: Record<registryKey | 'global', AbstractScribeSubscription>;
    disposeAll(): void;
}

export const ScribeSubscriptionHandler: ScribeSubscriptionHandler = {
    registry: {
        global: new GlobalSubscriptionHandler(),
        mob: new MobScribeSubscription(),
        metaskill: new SkillScribeSubscription(),
        item: new ItemScribeSubscription(),
        droptable: new DroptableSubscriptionHandler(),
        stat: new StatSubscriptionHandler(),
        pin: new PinSubscriptionHandler(),
        placeholder: new PlaceholderSubscriptionHandler(),
        randomspawn: new RandomSpawnSubscriptionHandler(),
        archetype: new ArchetypeSubscriptionHandler(),
        reagent: new ReagentSubscriptionHandler(),
        menu: new MenuSubscriptionHandler(),
        achievement: new AchievementSubscriptionHandler(),
    },

    disposeAll(): void {
        Object.values(this.registry).forEach((handler) => {
            handler.disposeAll();
        });
    },
};
