import { generateNumbersInRange, inheritSchemaOptions } from '../utils/schemautils';
import { DefaultPlugins, Schema, SchemaElementTypes } from '../objectInfos';
import { DropsSchema } from './commonSchema';

export const DroptableSchema: Schema = {
    TotalItems: {
        type: SchemaElementTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/DropTables#droptable-options',
        description:
            'Defines exactly how many drops the table will generate. Setting this causes item chances to be calculated as weights.',
        values: generateNumbersInRange(1, 16, 1, false),
    },
    MaxItems: {
        type: SchemaElementTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/DropTables#droptable-options',
        description:
            'Defines the maximum number of drops the table will generate. If only this is set, drops will run down the list unless the maximum number of items is reached. If you enable both MinItems and MaxItems, the chances for each table entry will become weights instead.',
        values: generateNumbersInRange(1, 16, 1, false),
    },
    MinItems: {
        type: SchemaElementTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/DropTables#droptable-options',
        description:
            'Defines the minimum number of drops the table will generate. If only this is set, drops will run down the list unless the minimum number of items is reached. If you enable both MinItems and MaxItems, the chances for each table entry will become weights instead.',
        values: generateNumbersInRange(1, 16, 1, false),
    },
    BonusLevelItems: {
        type: SchemaElementTypes.FLOAT,
        values: generateNumbersInRange(0, 1, 0.05, true),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/DropTables#droptable-options',
        description:
            "A modifier on the number of drops generated based on the mob's level. Can be set as a range, i.e. 0.2to0.5. Works like:amount = amount + (mob_level * bonus_level_items). Requires that TotalItems, MinItems, or MaxItems are set on the table",
    },
    BonusLuckItems: {
        type: SchemaElementTypes.FLOAT,
        values: generateNumbersInRange(0, 1, 0.05, true),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/DropTables#droptable-options',
        description:
            "A modifier on the number of drops generated based on the killer's luck stat. Can be set as a range, i.e. 0.15to8. Works with Luck attribute, Luck-based enchants/curses, and Luck potion effects. Works like: amount = amount + (luck * bonus_luck_items). Requires that TotalItems, MinItems, or MaxItems are set on the table",
    },
    Conditions: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/DropTables#conditions',
        description:
            'A list of conditions that must be met by the dropping entity for the table to drop items. If any condition fails, the table will not drop items.',
    },
    TriggerConditions: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/DropTables#triggerconditions',
        description:
            'A list of conditions that must be met by the entity that triggered the droptable for the table to drop items. If any condition fails, the table will not drop items.',
    },
    Drops: {
        ...DropsSchema,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/DropTables#droptable-options',
        description: 'A list of items that can drop from the table.',
    },
};

inheritSchemaOptions(
    DroptableSchema,
    'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/DropTables',
    DefaultPlugins.MythicMobs
);
