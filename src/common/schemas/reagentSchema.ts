import { inheritSchemaOptions } from '../utils/schemautils';
import { DefaultPlugins, Schema, SchemaElementTypes } from '../objectInfos';

const ResourceBarStateSchema: Schema = {
    Display: {
        type: SchemaElementTypes.STRING,
        description:
            'Action-bar template. Supports <name>, <amount>, <max>, <percent>, <bar>, and <rechargebar>.',
    },
    BarLength: {
        type: SchemaElementTypes.INTEGER,
        description: 'The number of cells generated for <bar> and <rechargebar>.',
    },
    BarSpacer: {
        type: SchemaElementTypes.STRING,
        description: 'The character or text used for empty bar cells.',
    },
    BarFiller: {
        type: SchemaElementTypes.STRING,
        description: 'The character or text used for filled bar cells.',
    },
    Conditions: {
        type: SchemaElementTypes.LIST,
        description: 'Conditions that determine whether this resource bar state applies.',
    },
};

export const ReagentSchema: Schema = {
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'How the reagent is displayed in messages and GUIs.',
    },
    MinValue: {
        type: SchemaElementTypes.STRING,
        description: 'The minimum value, a number, stat.<name>, or a supported expression.',
    },
    MaxValue: {
        type: SchemaElementTypes.STRING,
        description: 'The maximum value, a number, stat.<name>, or a supported expression.',
    },
    Global: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'If true, players always have this reagent.',
    },
    ResourceBarStates: {
        type: SchemaElementTypes.KEY,
        description: 'Named action-bar display states for this reagent.',
        keys: {
            '*KEY': {
                display: 'Resource bar state',
                type: SchemaElementTypes.KEY,
                description: 'A named action-bar state.',
                keys: ResourceBarStateSchema,
            },
        },
    },
};

inheritSchemaOptions(
    ReagentSchema,
    'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells/Reagents#custom-reagents',
    DefaultPlugins.MythicRPG
);
