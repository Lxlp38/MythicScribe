import {
    AbstractScribeEnum,
    addEnumLoadedFunction,
    EnumDatasetValue,
} from '@common/datasets/ScribeEnum';

import { generateNumbersInRange } from '../utils/schemautils';
import {
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
    KeySchemaElement,
} from '../objectInfos';

export const MobSchema: Schema = {
    Type: {
        type: SchemaElementTypes.ENUM,
        dataset: 'MYTHICENTITY',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#type',
        description: 'The Entity Type of the mob.',
    },
    Template: {
        type: SchemaElementTypes.ENUM,
        dataset: 'mob',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Templates',
        description: 'The templates for the mob.',
    },
    Exclude: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Templates#excluding-elements',
        description: 'A list of elements the mob should not inherit.',
    },
    Display: {
        type: SchemaElementTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#display',
        description: 'The display name of the mob.',
    },
    Health: {
        type: SchemaElementTypes.FLOAT,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#health',
        description: 'The health of the mob.',
    },
    Damage: {
        type: SchemaElementTypes.FLOAT,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#damage',
        description: 'The damage of the mob.',
    },
    Armor: {
        type: SchemaElementTypes.FLOAT,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#armor',
        description: 'The armor points of the mob.',
    },
    HealthBar: {
        type: SchemaElementTypes.KEY,
        keys: {
            Enabled: {
                type: SchemaElementTypes.BOOLEAN,
            },
            Offset: {
                type: SchemaElementTypes.FLOAT,
                values: generateNumbersInRange(0.1, 2.0, 0.1, true),
            },
        },
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#healthbar',
        description: 'The health bar of the mob.',
    },
    BossBar: {
        type: SchemaElementTypes.KEY,
        keys: {
            Enabled: {
                type: SchemaElementTypes.BOOLEAN,
            },
            Title: {
                type: SchemaElementTypes.STRING,
            },
            Range: {
                type: SchemaElementTypes.FLOAT,
                values: generateNumbersInRange(10, 100, 10, true),
            },
            Color: {
                type: SchemaElementTypes.ENUM,
                dataset: 'BARCOLOR',
            },
            Style: {
                type: SchemaElementTypes.ENUM,
                dataset: 'BARSTYLE',
            },
            CreateFog: {
                type: SchemaElementTypes.BOOLEAN,
            },
            DarkenSky: {
                type: SchemaElementTypes.BOOLEAN,
            },
            PlayMusic: {
                type: SchemaElementTypes.BOOLEAN,
            },
        },
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#bossbar',
        description: 'The boss bar of the mob.',
    },
    Faction: {
        type: SchemaElementTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#faction',
        description: 'The faction of the mob.',
    },
    Mount: {
        type: SchemaElementTypes.ENUM,
        dataset: 'mob',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#mount',
        description: 'The mount of the mob.',
    },
    Options: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Options',
        description: 'The options of the mob.',
        keys: {},
    },
    Modules: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#modules',
        description: 'The modules of the mob.',
        keys: {
            ThreatTable: {
                type: SchemaElementTypes.BOOLEAN,
            },
            ImmunityTable: {
                type: SchemaElementTypes.BOOLEAN,
            },
        },
    },
    AIGoalSelectors: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Custom-AI#ai-goal-selectors',
        description: 'The AI goal selectors of the mob.',
    },
    AITargetSelectors: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Custom-AI#ai-target-selectors',
        description: 'The AI target selectors of the mob.',
    },
    Drops: {
        type: SchemaElementTypes.LIST,
        dataset: 'ITEM',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#drops',
        description: 'The drops of the mob.',
    },
    DamageModifiers: {
        type: SchemaElementTypes.LIST,
        dataset: 'DAMAGECAUSE',
        values: generateNumbersInRange(-1.0, 2.0, 0.1, true),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#damagemodifiers',
        description: 'The damage modifiers of the mob.',
    },
    Equipment: {
        type: SchemaElementTypes.LIST,
        dataset: 'ITEM',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#equipment',
        description: 'The equipment of the mob.',
    },
    KillMessages: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#killmessages',
        description: 'The kill messages of the mob.',
    },
    LevelModifiers: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#levelmodifiers',
        description: 'The level modifiers of the mob.',
        keys: {
            Health: {
                type: SchemaElementTypes.FLOAT,
            },
            Damage: {
                type: SchemaElementTypes.FLOAT,
            },
            Armor: {
                type: SchemaElementTypes.FLOAT,
            },
            KnockbackResistance: {
                type: SchemaElementTypes.FLOAT,
                values: generateNumbersInRange(0.0, 1.0, 0.1, true),
            },
            Power: {
                type: SchemaElementTypes.FLOAT,
            },
            MovementSpeed: {
                type: SchemaElementTypes.FLOAT,
                values: generateNumbersInRange(0.0, 0.4, 0.05, true),
            },
        },
    },
    Disguise: {
        type: SchemaElementTypes.ENUM,
        dataset: 'ENTITYTYPE',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#disguise',
        description: 'The disguise of the mob.',
    },
    Skills: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#skills',
        description: 'The skills of the mob.',
    },
    Nameplate: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#nameplate',
        description: 'The nameplate of the mob.',
        keys: {
            Enabled: {
                type: SchemaElementTypes.BOOLEAN,
            },
            Offset: {
                type: SchemaElementTypes.FLOAT,
                values: generateNumbersInRange(0.1, 2.0, 0.1, true),
            },
            Scale: {
                type: SchemaElementTypes.VECTOR,
                values: ['1,1,1'],
            },
            Mounted: {
                type: SchemaElementTypes.BOOLEAN,
            },
        },
    },
    Hearing: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#hearing',
        description: 'The hearing of the mob.',
        keys: {
            Enabled: {
                type: SchemaElementTypes.BOOLEAN,
            },
        },
    },
    Totem: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#totem',
        description:
            'Allows you to configure a custom structure that, once built, will summon a mob',
        keys: {
            Head: {
                type: SchemaElementTypes.ENUM,
                dataset: 'MATERIAL',
                description:
                    'The block that once placed will prompt the plugin to check for a totem',
            },
            Pattern: {
                type: SchemaElementTypes.LIST,
                description:
                    'A list of offset vectors and materials that define what the totem should look like',
            },
            Replacement: {
                type: SchemaElementTypes.LIST,
                description: 'Optional list of replacements blocks for the pattern',
            },
        },
    },
    Variables: {
        type: SchemaElementTypes.KEY_LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#variables',
        description: 'The variables of the mob.',
    },
    Trades: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#trades',
        description: 'The trades of the mob.',
        keys: {
            [SchemaElementSpecialKeys.WILDKEY]: {
                type: SchemaElementTypes.KEY,
                display: 'Insert Trade Internal Name',
                description: 'The internal name of the trade.',
                keys: {
                    Item1: {
                        type: SchemaElementTypes.STRING,
                        description: 'The first item in the trade.',
                    },
                    Item2: {
                        type: SchemaElementTypes.STRING,
                        description: 'The second item in the trade.',
                    },
                    MaxUses: {
                        type: SchemaElementTypes.INTEGER,
                        values: generateNumbersInRange(1, 100, 1, false),
                        description: 'The maximum number of uses for the trade.',
                    },
                    Result: {
                        type: SchemaElementTypes.STRING,
                        description: 'The resulting item of the trade.',
                    },
                },
            },
        },
    },
};

addEnumLoadedFunction('moboption', (target: AbstractScribeEnum) => {
    addMobOptions(target.getDataset());
});

export function addMobOptions(options: Map<string, EnumDatasetValue>) {
    const mobOptions = (MobSchema.Options as KeySchemaElement).keys;
    for (const [name, body] of options) {
        mobOptions[name] = {
            type: SchemaElementTypes.STRING,
            link:
                'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Options#' +
                name.toLowerCase(),
            description: body.description,
        };
    }
}
