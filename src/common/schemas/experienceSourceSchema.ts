import { inheritSchemaOptions } from '../utils/schemautils';
import { DefaultPlugins, Schema, SchemaElementTypes } from '../objectInfos';

const sourceTypes = [
    'BLOCK_BREAK',
    'BREAK_BLOCK',
    'MINE',
    'MINING',
    'BLOCK_PLACE',
    'PLACE_BLOCK',
    'BUILD',
    'BUILDING',
    'BREWING',
    'BREW',
    'BREW_ITEM',
    'CAST_SPELL',
    'SPELL_CAST',
    'SPELL',
    'CAST',
    'CONSUME_ITEM',
    'EATING',
    'EAT',
    'EAT_ITEM',
    'CRAFT_ITEM',
    'CRAFT',
    'CRAFTING',
    'CUSTOM',
    'DAMAGED',
    'TAKE_DAMAGE',
    'DAMAGING',
    'DEAL_DAMAGE',
    'ENCHANTING',
    'ENCHANT',
    'ENCHANT_ITEM',
    'FARMING',
    'HARVEST',
    'HARVEST_CROP',
    'FISHING',
    'FISH',
    'CATCH_FISH',
    'JUMPING',
    'JUMP',
    'KILL_ENTITY',
    'KILL_MOB',
    'KILL_MOBS',
    'KILL_ENTITIES',
    'KILL_MYTHIC',
    'KILL_MYTHIC_MOB',
    'KILL_MYTHIC_ENTITIES',
    'MOVING',
    'MOVE',
    'WALK',
    'REPAIR_ITEM',
    'REPAIR',
    'MEND',
    'SMELT',
    'SMELTING',
    'FURNACE',
    'USE_RESOURCE',
    'RESOURCE_USE',
    'SPEND_RESOURCE',
    'VANILLA',
];

const sourceEntrySchema: Schema = {
    Type: {
        type: SchemaElementTypes.STRING,
        values: sourceTypes,
        description: 'The event or activity that grants experience.',
    },
    Values: {
        type: SchemaElementTypes.LIST,
        description: 'Values paired with experience amounts, such as ZOMBIE 5 or STONE 1.',
    },
    PlayerPlaced: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether player-placed blocks should grant experience when broken.',
    },
    Multiplier: {
        type: SchemaElementTypes.FLOAT,
        description: 'Multiplier applied to vanilla experience pickup.',
    },
    Amount: {
        type: SchemaElementTypes.STRING,
        description: 'A placeholder expression for the experience granted. Overrides Default.',
    },
    Default: {
        type: SchemaElementTypes.STRING,
        description: 'The experience granted when no matching entry is found in Values.',
    },
    Conditions: {
        type: SchemaElementTypes.LIST,
        description: 'Conditions evaluated against the player before experience is granted.',
    },
    TriggerConditions: {
        type: SchemaElementTypes.LIST,
        description: 'Conditions evaluated against the trigger of the experience source.',
    },
};

const experienceSourceGroupSchema: Schema = {
    Message: {
        type: SchemaElementTypes.STRING,
        description: 'Optional message shown when experience is gained from this source group.',
    },
    Sources: {
        type: SchemaElementTypes.LIST,
        entries: Object.entries(sourceEntrySchema).map(([key, element]) => ({
            ...element,
            description: `${key}: ${element.description}`,
        })),
        description: 'The list of experience source handlers in this group.',
    },
};

export const ExperienceSourceSchema: Schema = {
    Message: experienceSourceGroupSchema.Message,
    Sources: experienceSourceGroupSchema.Sources,
};

inheritSchemaOptions(
    ExperienceSourceSchema,
    'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Archetypes/Leveling#experience-sources',
    DefaultPlugins.MythicRPG
);
