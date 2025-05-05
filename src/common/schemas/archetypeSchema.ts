import { inheritSchemaOptions } from '../utils/schemautils';
import { DefaultPlugins, Schema, SchemaElementTypes } from '../objectInfos';

export const ArchetypeSchema: Schema = {
    Group: {
        type: SchemaElementTypes.STRING,
        description: "The type of archetype this falls under, such as 'CLASS'",
    },
    Display: {
        type: SchemaElementTypes.STRING,
        description: "The proper display name of this archetype, such as 'Wizard'",
    },
    Description: {
        type: SchemaElementTypes.STRING,
        description: 'The description of the archetype',
    },
    BaseStats: {
        type: SchemaElementTypes.LIST,
        dataset: 'STAT',
        description: 'A list of base stats for this archetype',
    },
    StatModifiers: {
        type: SchemaElementTypes.LIST,
        dataset: 'STAT',
        description:
            "Unlike base stats, these will apply on top of a player's stats and can stack with other archetypes",
    },
    SpellUnlocks: {
        type: SchemaElementTypes.LIST,
        description: 'A list of spells unlocked by this archetype',
    },
    InitSkills: {
        type: SchemaElementTypes.LIST,
        description: 'A list of skills called when a player gains this class',
    },
    QuitSkills: {
        type: SchemaElementTypes.LIST,
        description: 'A list of skills called when a player loses this class',
    },
    LevelSkills: {
        type: SchemaElementTypes.LIST,
        description: 'A list of skills called when a player levels up this class',
    },
    Skills: {
        type: SchemaElementTypes.LIST,
        description:
            'A list of mechanics applied to anyone with this archetype. Functions the same as how Mythic Mobs are configured',
    },
    Leveling: {
        type: SchemaElementTypes.KEY,
        description: 'A list of options regarding how the class levels up',
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Archetypes/Leveling',
        keys: {
            MinLevel: {
                type: SchemaElementTypes.INTEGER,
                description: 'The level the player starts at with this archetype',
            },
            MaxLevel: {
                type: SchemaElementTypes.INTEGER,
                description: 'The maximum level of this archetype',
            },
            ExperienceCurve: {
                type: SchemaElementTypes.STRING,
                description: 'The experience curve this archetype uses',
            },
            ExperienceSource: {
                type: SchemaElementTypes.STRING,
                description: 'The experience source group this archetype can benefit from',
            },
        },
    },
    Bindings: {
        type: SchemaElementTypes.LIST,
        description: "Force a player's bindings as they level up",
    },
};

inheritSchemaOptions(
    ArchetypeSchema,
    'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Archetypes#configuration',
    DefaultPlugins.MythicRPG
);
