import { inheritSchemaOptions } from '../utils/schemautils';
import { DefaultPlugins, Schema, SchemaElementTypes } from '../objectInfos';

export const EquipmentSetSchema: Schema = {
    Enabled: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'If the equipment set is enabled.',
    },
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'The name of the equipment set.',
    },
    Lore: {
        type: SchemaElementTypes.LIST,
        description: 'The lore of the equipment set',
    },
    Bonuses: {
        type: SchemaElementTypes.LIST,
        description: 'The bonuses granted by the equipment set.',
    },
};

inheritSchemaOptions(
    EquipmentSetSchema,
    'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Sets',
    DefaultPlugins.MythicCrucible
);
