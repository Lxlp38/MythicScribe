import { generateNumbersInRange, inheritSchemaOptions } from '../utils/schemautils';
import { DefaultPlugins, Schema, SchemaElementTypes } from '../objectInfos';

export const MetaskillSchema: Schema = {
    Skills: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#skills',
        description: 'The list of the mechanics that will be executed by the metaskill.',
    },
    Conditions: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#conditions',
        description:
            'The list of conditions that will evaluate the caster of the metaskill before execution.',
    },
    TargetConditions: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#targetconditions',
        description:
            'The list of conditions that will evaluate the target of the metaskill before execution',
    },
    TriggerConditions: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#triggerconditions',
        description:
            'The list of conditions that will evaluate the trigger of the metaskill before execution',
    },
    Cooldown: {
        type: SchemaElementTypes.FLOAT,
        values: generateNumbersInRange(0, 100, 10, false),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#cooldown',
        description: 'The cooldown of the metaskill (in seconds).',
    },
    CancelIfNoTargets: {
        type: SchemaElementTypes.BOOLEAN,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#cancelifnotargets',
        description: 'Whether the metaskill should be cancelled if there are no targets.',
    },
    FailedConditionsSkill: {
        type: SchemaElementTypes.ENUM,
        dataset: 'METASKILL',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#failedconditionsskill',
        description: 'The name of the metaskill to cast if the conditions fail.',
    },
    OnCooldownSkill: {
        type: SchemaElementTypes.ENUM,
        dataset: 'METASKILL',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#oncooldownskill',
        description: 'The name of the metaskill to cast if the metaskill is on cooldown.',
    },
};

inheritSchemaOptions(
    MetaskillSchema,
    'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills',
    DefaultPlugins.MythicMobs
);
