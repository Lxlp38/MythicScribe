import { generateNumbersInRange, inheritSchemaOptions } from '../utils/schemautils';
import {
    DefaultPlugins,
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
} from '../objectInfos';

const buttonSchema: Schema = {
    Skills: {
        type: SchemaElementTypes.LIST,
        description: 'The skills that get executed when the button is pressed',
    },
    Material: {
        type: SchemaElementTypes.ENUM,
        dataset: 'MATERIAL',
        description: 'The material of the button',
    },
    Model: {
        type: SchemaElementTypes.INTEGER,
        description: 'The model data of the button',
    },
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'The display name of the button',
    },
    Mapping: {
        type: SchemaElementTypes.STRING,
        description: 'The mapping of the button',
    },
};

export const MenuSchema: Schema = {
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'The display name of the menu',
    },
    Size: {
        type: SchemaElementTypes.INTEGER,
        description: 'The size of the menu',
        values: generateNumbersInRange(9, 54, 9, false),
    },
    Schema: {
        type: SchemaElementTypes.LIST,
        description: 'The schema of the menu',
    },
    Icons: {
        type: SchemaElementTypes.KEY,
        description: 'The icons of the menu',
        keys: {
            [SchemaElementSpecialKeys.WILDKEY]: {
                display: 'Icon',
                type: SchemaElementTypes.KEY,
                description: 'The icons of the menu',
                keys: buttonSchema,
            },
        },
    },
};

inheritSchemaOptions(
    MenuSchema,
    'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Custom-Menus',
    DefaultPlugins.MythicRPG
);
