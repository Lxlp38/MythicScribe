import { generateNumbersInRange, inheritSchemaOptions } from '../utils/schemautils';
import {
    DefaultPlugins,
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
} from '../objectInfos';

export const AchievementSchema: Schema = {
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'The display name of the achievement',
    },
    Description: {
        type: SchemaElementTypes.STRING,
        description: 'The description of the achievement',
    },
    Category: {
        type: SchemaElementTypes.STRING,
        description: 'The category of the achievement',
    },
    Parent: {
        type: SchemaElementTypes.ENUM,
        dataset: 'ACHIEVEMENT',
        description: 'The parent achievement id of this achievement',
    },
    Frame: {
        type: SchemaElementTypes.ENUM,
        dataset: 'advancementdisplayframe',
        description: 'The frame of the achievement',
    },
    Icon: {
        type: SchemaElementTypes.KEY,
        description: 'The icon of the achievement',
        keys: {
            Material: {
                type: SchemaElementTypes.ENUM,
                dataset: 'MATERIAL',
                description: 'The material of the icon',
            },
            Model: {
                type: SchemaElementTypes.INTEGER,
                description: 'The model data of the icon',
            },
            SkullTexture: {
                type: SchemaElementTypes.STRING,
                description: 'The texture of the skull icon',
            },
        },
    },
    Criteria: {
        type: SchemaElementTypes.KEY,
        description: 'The criteria of the achievement',
        keys: {
            [SchemaElementSpecialKeys.WILDKEY]: {
                display: 'Criteria',
                type: SchemaElementTypes.KEY,
                description: 'The ID of the criteria',
                keys: {
                    Type: {
                        type: SchemaElementTypes.ENUM,
                        dataset: 'ACHIEVEMENTCRITERIA',
                        description: 'The type of the criteria',
                    },
                    Conditions: {
                        type: SchemaElementTypes.LIST,
                        description: 'A list of Mythic conditions to check against',
                    },
                    Amount: {
                        type: SchemaElementTypes.INTEGER,
                        description: 'The amount of times the criteria must be triggered',
                        values: generateNumbersInRange(1, 100, 1, false),
                    },
                    CheckInterval: {
                        type: SchemaElementTypes.INTEGER,
                        description:
                            'Conditional Criteria: How often the conditions are checked (in ticks)',
                        values: generateNumbersInRange(0, 200, 10, false, 1),
                    },
                    Sync: {
                        type: SchemaElementTypes.BOOLEAN,
                        description: 'Whether the check should run synchronously',
                    },
                    Block: {
                        type: SchemaElementTypes.ENUM,
                        dataset: 'MATERIAL',
                        description: 'Block Criteria: The block to check against',
                    },
                    EntityType: {
                        type: SchemaElementTypes.ENUM,
                        dataset: 'ENTITYTYPE',
                        description: 'KillMob Criteria: The entity type to check against',
                    },
                    MobType: {
                        type: SchemaElementTypes.ENUM,
                        dataset: 'MOB',
                        description: 'KillMythicMob Criteria: The MythicMob to check against',
                    },
                },
            },
        },
    },
    Reward: {
        type: SchemaElementTypes.KEY,
        description: 'The reward for completing the achievement',
        keys: {
            Message: {
                type: SchemaElementTypes.STRING,
                description: 'A message displayed when the achievement is completed',
            },
            Drops: {
                type: SchemaElementTypes.LIST,
                description: 'A list of Mythic drop tables',
            },
            Skills: {
                type: SchemaElementTypes.LIST,
                description: 'A list of skills executed when the achievement is completed',
            },
        },
    },
};

inheritSchemaOptions(
    AchievementSchema,
    'https://git.lumine.io/mythiccraft/mythicachievements/-/wikis/Usage',
    DefaultPlugins.MythicAchievements
);
