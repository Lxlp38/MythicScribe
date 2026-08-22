import {
    DefaultPlugins,
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
} from '../objectInfos';
import { inheritSchemaOptions } from '../utils/schemautils';
import { TalentTreeSchema } from './archetypeSchema';

/**
 * Standalone MythicRPG talent trees are keyed by tree ID in talents.yml.
 * The tree body is the same shape as an archetype's inline TalentTree block.
 */
export const TalentTreeFileSchema: Schema = {
    [SchemaElementSpecialKeys.WILDKEY]: {
        display: 'Talent Tree',
        type: SchemaElementTypes.KEY,
        description: 'A standalone MythicRPG talent tree.',
        keys: TalentTreeSchema,
    },
};

inheritSchemaOptions(
    TalentTreeFileSchema,
    'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Archetypes/Talents',
    DefaultPlugins.MythicRPG
);
