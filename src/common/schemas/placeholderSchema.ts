import {
    DefaultPlugins,
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
} from '@common/objectInfos';
import { inheritSchemaOptions } from '@common/utils/schemautils';

export const PlaceholderSchema: Schema = {
    Default: {
        type: SchemaElementTypes.STRING,
        description: 'The default value of the placeholder if no value is set.',
    },
    [SchemaElementSpecialKeys.WILDKEY]: {
        display: 'Placeholder Case',
        type: SchemaElementTypes.KEY,
        description: 'The internal name for a possible placeholder output',
        keys: {
            Conditions: {
                type: SchemaElementTypes.LIST,
                description: 'The conditions that must be met for this placeholder to be used.',
            },
            Value: {
                type: SchemaElementTypes.STRING,
                description: 'The value of the placeholder when the conditions are met.',
            },
        },
    },
};

inheritSchemaOptions(
    PlaceholderSchema,
    'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Placeholders#custom-placeholders',
    DefaultPlugins.MythicMobs
);
