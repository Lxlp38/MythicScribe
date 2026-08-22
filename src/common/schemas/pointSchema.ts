import { inheritSchemaOptions } from '../utils/schemautils';
import { DefaultPlugins, Schema, SchemaElementTypes } from '../objectInfos';

/**
 * MythicRPG point types are keyed by point ID in points.yml. As with every other
 * file schema, this describes the body of a single entry: the file-level ID is
 * consumed by the resolver before the schema is applied.
 */
export const PointSchema: Schema = {
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'The display name of the point type. Defaults to the point type key.',
    },
};

inheritSchemaOptions(
    PointSchema,
    'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Points',
    DefaultPlugins.MythicRPG
);
