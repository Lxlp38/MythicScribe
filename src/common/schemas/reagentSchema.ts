import { generateNumbersInRange, inheritSchemaOptions } from '../utils/schemautils';
import { DefaultPlugins, Schema, SchemaElementTypes } from '../objectInfos';

export const ReagentSchema: Schema = {
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'How the reagent is displayed in messages and GUIs.',
    },
    MinValue: {
        type: SchemaElementTypes.ENUM,
        dataset: 'REAGENTVALUE',
        description: 'The minimum value of the reagent.',
        values: generateNumbersInRange(0, 100, 1, true),
    },
    MaxValue: {
        type: SchemaElementTypes.ENUM,
        dataset: 'REAGENTVALUE',
        description: 'The maximum value of the reagent.',
        values: generateNumbersInRange(0, 100, 1, true),
    },
    Global: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'If true, players always have this reagent.',
    },
};

inheritSchemaOptions(
    ReagentSchema,
    'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Spells/Reagents#custom-reagents',
    DefaultPlugins.MythicRPG
);
