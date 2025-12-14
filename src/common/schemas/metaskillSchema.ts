import { generateNumbersInRange, inheritSchemaOptions } from '../utils/schemautils';
import { DefaultPlugins, Schema, SchemaElementTypes } from '../objectInfos';
import { Generation } from './itemSchema';

const customCommand: Schema = {
    Command: {
        type: SchemaElementTypes.KEY,
        description:
            'The field Command allows the metaskill it is used into to be regarded as a command, also enabling all of the relative options',
        plugin: DefaultPlugins.MythicMobs,
        link: 'https://git.lumine.io/mythiccraft/mythicmobs/-/wikis/Skills/Skill-Commands',
        keys: {
            Id: {
                type: SchemaElementTypes.STRING,
                description: 'The unique identifier for the command.',
                link: 'https://git.lumine.io/mythiccraft/mythicmobs/-/wikis/Skills/Skill-Commands#id',
            },
            Aliases: {
                type: SchemaElementTypes.LIST,
                description: 'A list of aliases for the command.',
                link: 'https://git.lumine.io/mythiccraft/mythicmobs/-/wikis/Skills/Skill-Commands#aliases',
            },
            Completions: {
                type: SchemaElementTypes.KEY_LIST,
                description: 'The completions for the command.',
                link: 'https://git.lumine.io/mythiccraft/mythicmobs/-/wikis/Skills/Skill-Commands#completions',
            },
        },
    },
};

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
    Spell: {
        type: SchemaElementTypes.BOOLEAN,
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#functional-options',
        description: 'Turns the skill into a spell and allows players to learn it if set to true',
        plugin: DefaultPlugins.MythicRPG,
    },
    LearnConditions: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#functional-options',
        description: 'A list of conditions that must be met to learn the spell.',
        plugin: DefaultPlugins.MythicRPG,
    },
    Trigger: {
        type: SchemaElementTypes.ENUM,
        dataset: 'trigger',
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#functional-options',
        description: 'What triggers the spell. Defaults to ~onCombat.',
        plugin: DefaultPlugins.MythicRPG,
    },
    Targeter: {
        type: SchemaElementTypes.ENUM,
        dataset: 'targeter',
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#functional-options',
        description:
            "The main targeter for the spell. Defaults to @self. The spell will fail to cast and not consume resources if a valid target isn't found.",
        plugin: DefaultPlugins.MythicRPG,
    },
    Cost: {
        type: SchemaElementTypes.LIST,
        dataset: 'REAGENT',
        values: generateNumbersInRange(0, 100, 1, true),
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#functional-options',
        description: 'A list of reagents this spell costs to cast.',
        plugin: DefaultPlugins.MythicRPG,
    },
    Global: {
        type: SchemaElementTypes.BOOLEAN,
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#functional-options',
        description:
            'Makes it a global spell, causing it to be automatically applied to all players.',
        plugin: DefaultPlugins.MythicRPG,
    },
    Upgrades: {
        type: SchemaElementTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#functional-options',
        description: 'The maximum level the spell can reach. Defaults to 1.',
        plugin: DefaultPlugins.MythicRPG,
    },
    Bindable: {
        type: SchemaElementTypes.BOOLEAN,
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#functional-options',
        description:
            'Whether the slot from which this spell can be cast can be binded. Defaults to false. Once binded, the ~onUse trigger is needed to cast the skill.',
        plugin: DefaultPlugins.MythicRPG,
    },
    Display: {
        type: SchemaElementTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#aesthetic-options',
        description: 'The display name of the spell',
        plugin: DefaultPlugins.MythicRPG,
    },
    Description: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#aesthetic-options',
        description: 'A description of what the spell does for GUIs and info commands.',
        plugin: DefaultPlugins.MythicRPG,
    },
    Icon: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#aesthetic-options',
        description: 'The icon representing the spell.',
        plugin: DefaultPlugins.MythicRPG,
        keys: {
            Material: {
                type: SchemaElementTypes.ENUM,
                description: 'The material of the icon.',
                dataset: 'MATERIAL',
            },
            Model: {
                type: SchemaElementTypes.STRING,
                description: 'The model of the icon.',
            },
            ...Generation,
        },
    },
    KillMessage: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells#aesthetic-options',
        description: 'A list of kill messages associated with the spell.',
        plugin: DefaultPlugins.MythicRPG,
    },
    ...customCommand,
};

inheritSchemaOptions(
    MetaskillSchema,
    'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills',
    DefaultPlugins.MythicMobs
);
