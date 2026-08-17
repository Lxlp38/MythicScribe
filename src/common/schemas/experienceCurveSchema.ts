import { inheritSchemaOptions } from '../utils/schemautils';
import { DefaultPlugins, Schema, SchemaElementTypes } from '../objectInfos';

const ExperienceCurveEntrySchema: Schema = {
    Type: {
        type: SchemaElementTypes.STRING,
        values: ['FORMULA', 'STATIC'],
        description: 'The type of experience curve to load.',
    },
    Formula: {
        type: SchemaElementTypes.STRING,
        description: 'An exp4j formula using x as the current level, for example x * 100.',
    },
    Levels: {
        type: SchemaElementTypes.KEY_LIST,
        description: 'A level-to-experience map used by STATIC curves.',
    },
};

export const ExperienceCurveSchema: Schema = ExperienceCurveEntrySchema;

inheritSchemaOptions(
    ExperienceCurveSchema,
    'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Archetypes/Leveling#experience-curves',
    DefaultPlugins.MythicRPG
);
