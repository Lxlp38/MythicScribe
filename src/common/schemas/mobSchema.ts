import * as vscode from 'vscode';
import {
    AbstractScribeEnum,
    EnumDatasetValue,
    ScribeEnumHandler,
} from '@common/datasets/ScribeEnum';
import { getRootKey } from '@common/utils/yamlutils';
import { MobMythicNode, MythicNodeHandler } from '@common/mythicnodes/MythicNode';

import {
    generateNumbersInRange,
    generateVectorsInRange,
    inheritSchemaOptions,
} from '../utils/schemautils';
import {
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
    KeySchemaElement,
    DefaultPlugins,
    getKeySchema,
} from '../objectInfos';
import { DropsSchema } from './commonSchema';

export const MobSchema: Schema = {
    Type: {
        type: SchemaElementTypes.ENUM,
        dataset: 'MYTHICENTITY',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#type',
        description: 'The Entity Type of the mob.',
    },
    Template: {
        type: SchemaElementTypes.ENUM,
        dataset: 'MOB',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Templates',
        description: 'The templates for the mob.',
    },
    Exclude: {
        type: SchemaElementTypes.LIST,
        dataset: 'MOBSCHEMA',
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
        ...DropsSchema,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#drops',
        description: 'The drops of the mob.',
    },
    DamageModifiers: {
        type: SchemaElementTypes.LIST,
        entries: [
            {
                type: SchemaElementTypes.ENUM,
                dataset: 'DAMAGECAUSE',
            },
            {
                type: SchemaElementTypes.FLOAT,
                description: 'The multiplier of the inbound damage of the same type.',
                values: generateNumbersInRange(-1.0, 2.0, 0.1, true),
            },
        ],
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#damagemodifiers',
        description: 'The damage modifiers of the mob.',
    },
    Equipment: {
        type: SchemaElementTypes.LIST,
        entries: [
            {
                type: SchemaElementTypes.ENUM,
                dataset: 'ITEM',
            },
            {
                type: SchemaElementTypes.ENUM,
                dataset: 'EQUIPSLOT',
            },
        ],
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
        type: SchemaElementTypes.ENTRY_LIST,
        entries: [
            {
                type: SchemaElementTypes.ENUM,
                dataset: 'ENTITYTYPE',
            },
            {
                type: SchemaElementTypes.STRING,
                description: 'The disguise options',
            },
        ],
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
                dataset: 'BLOCK',
                description:
                    'The block that once placed will prompt the plugin to check for a totem',
            },
            Pattern: {
                type: SchemaElementTypes.LIST,
                entries: [
                    {
                        type: SchemaElementTypes.VECTOR,
                        values: generateVectorsInRange(-1, 1, 1),
                        description: 'The offset vector for the totem block',
                    },
                    {
                        type: SchemaElementTypes.ENUM,
                        dataset: 'BLOCK',
                        description: 'The block type for the totem block',
                    },
                ],
                description:
                    'A list of offset vectors and materials that define what the totem should look like',
            },
            Replacement: {
                type: SchemaElementTypes.LIST,
                entries: [
                    {
                        type: SchemaElementTypes.VECTOR,
                        values: generateVectorsInRange(-1, 1, 1),
                        description: 'The offset vector for the totem block',
                    },
                    {
                        type: SchemaElementTypes.ENUM,
                        dataset: 'BLOCK',
                        description: 'The block type for the totem block',
                    },
                ],
                description: 'Optional list of replacements blocks for the pattern',
            },
        },
    },
    Variables: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#variables',
        description: 'The variables of the mob.',
        maxDepth: true,
        keys: getMobVariables,
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
                        type: SchemaElementTypes.ENTRY_LIST,
                        entries: [
                            {
                                type: SchemaElementTypes.INTEGER,
                                values: generateNumbersInRange(1, 64, 1, false),
                            },
                            {
                                type: SchemaElementTypes.ENUM,
                                dataset: 'ITEM',
                            },
                        ],
                        description: 'The first item in the trade.',
                    },
                    Item2: {
                        type: SchemaElementTypes.ENTRY_LIST,
                        entries: [
                            {
                                type: SchemaElementTypes.INTEGER,
                                values: generateNumbersInRange(1, 64, 1, false),
                            },
                            {
                                type: SchemaElementTypes.ENUM,
                                dataset: 'ITEM',
                            },
                        ],
                        description: 'The second item in the trade.',
                    },
                    MaxUses: {
                        type: SchemaElementTypes.INTEGER,
                        values: generateNumbersInRange(1, 100, 1, false),
                        description: 'The maximum number of uses for the trade.',
                    },
                    Result: {
                        type: SchemaElementTypes.ENTRY_LIST,
                        entries: [
                            {
                                type: SchemaElementTypes.INTEGER,
                                values: generateNumbersInRange(1, 64, 1, false),
                            },
                            {
                                type: SchemaElementTypes.ENUM,
                                dataset: 'ITEM',
                            },
                        ],
                        description: 'The resulting item of the trade.',
                    },
                },
            },
        },
    },
    DropOptions: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops',
        description: 'The FancyDrop options for the mob',
        keys: {
            DropMethod: {
                type: SchemaElementTypes.ENUM,
                dataset: 'DROPMETHOD',
                description: 'Determines the drop method. Defaults to VANILLA.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#dropmethod',
            },
            ShowDeathChatMessage: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether to show the death chat message to the players.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#showdeathchatmessage',
            },
            ShowDeathHologram: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether to show the death hologram to the players.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#showdeathhologram',
            },
            PerPlayerDrops: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether to calculate drops separately for each player.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#perplayerdrops',
            },
            ClientSideDrops: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether drops should be seen per-player in a client-side manner.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#clientsidedrops',
            },
            Lootsplosion: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether the drops should do a lootsplosion effect by default.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#lootsplosion',
            },
            HologramItemNames: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether the items should have a hologram name by default.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#hologramitemnames',
            },
            ItemGlowByDefault: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether items should glow by default.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#itemglowbydefault',
            },
            ItemBeamByDefault: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether items should have a beam by default.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#itembeambydefault',
            },
            ItemVFXByDefault: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether items should have a VFX by default.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#itemvfxbydefault',
            },
            ItemVFX: {
                type: SchemaElementTypes.KEY,
                description: 'The VFX material for the items.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#itemvfx',
                keys: {
                    Material: {
                        type: SchemaElementTypes.ENUM,
                        dataset: 'MATERIAL',
                        description: 'The default material of the VFX.',
                    },
                    Model: {
                        type: SchemaElementTypes.INTEGER,
                        description: 'The default model of the VFX.',
                    },
                },
            },
            RequiredDamagePercent: {
                type: SchemaElementTypes.FLOAT,
                values: generateNumbersInRange(0.0, 1.0, 0.1, true),
                description: 'The required damage percentage to generate drops for a player.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#requireddamagepercent',
            },
            HologramTimeout: {
                type: SchemaElementTypes.INTEGER,
                values: generateNumbersInRange(1000, 10000, 1000, false),
                description: 'The timeout for the hologram in milliseconds.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#hologramtimeout',
            },
            HologramMessage: {
                type: SchemaElementTypes.LIST,
                description: 'The hologram message displayed when the mob dies.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#hologrammessage',
            },
            ChatMessage: {
                type: SchemaElementTypes.LIST,
                description: 'The chat message sent to players when the mob dies.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/drops/FancyDrops#chatmessage',
            },
        },
    },
    DisplayOptions: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions',
        description: 'Options for configuring display entities.',
        keys: {
            ViewRange: {
                type: SchemaElementTypes.FLOAT,
                description: 'The maximum view range/distance.',
                values: generateNumbersInRange(0.1, 10.0, 0.1, true),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#viewrange',
            },
            Width: {
                type: SchemaElementTypes.FLOAT,
                description: 'The display width.',
                values: generateNumbersInRange(0.0, 10.0, 0.1, true),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#width',
            },
            Height: {
                type: SchemaElementTypes.FLOAT,
                description: 'The display height.',
                values: generateNumbersInRange(0.0, 10.0, 0.1, true),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#height',
            },
            ShadowRadius: {
                type: SchemaElementTypes.FLOAT,
                description: "The display's shadow radius.",
                values: generateNumbersInRange(0.0, 10.0, 0.1, true),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#shadowradius',
            },
            ShadowStrength: {
                type: SchemaElementTypes.FLOAT,
                description: "The opacity of the display entity's shadow.",
                values: generateNumbersInRange(0.0, 1.0, 0.1, true),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#shadowstrength',
            },
            Billboard: {
                type: SchemaElementTypes.ENUM,
                description: 'Controls where the display entity pivots when rendered.',
                dataset: 'BILLBOARD',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#billboard',
            },
            TeleportDuration: {
                type: SchemaElementTypes.INTEGER,
                description: 'Set the teleport duration in ticks.',
                values: generateNumbersInRange(0, 100, 1, false),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#teleportduration',
            },
            InterpolationDelay: {
                type: SchemaElementTypes.INTEGER,
                description: 'Set the delay before starting interpolation.',
                values: generateNumbersInRange(0, 100, 1, false),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#interpolationdelay',
            },
            InterpolationDuration: {
                type: SchemaElementTypes.INTEGER,
                description: 'Set the interpolation duration in ticks.',
                values: generateNumbersInRange(0, 100, 1, false),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#interpolationduration',
            },
            ColorOverride: {
                type: SchemaElementTypes.STRING,
                description: 'Set the glow border color.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#coloroverride',
            },
            BlockLight: {
                type: SchemaElementTypes.INTEGER,
                description: 'Set the blocklight brightness.',
                values: generateNumbersInRange(0, 15, 1, false),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#blocklight',
            },
            SkyLight: {
                type: SchemaElementTypes.INTEGER,
                description: 'Set the skylight brightness.',
                values: generateNumbersInRange(0, 15, 1, false),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#skylight',
            },
            Translation: {
                type: SchemaElementTypes.VECTOR,
                description: 'Set the display entity translation.',
                values: ['0,0,0'],
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#translation',
            },
            Scale: {
                type: SchemaElementTypes.VECTOR,
                description: 'Set the scale of the display entity.',
                values: ['1,1,1'],
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#scale',
            },
            LeftRotation: {
                type: SchemaElementTypes.VECTOR,
                description: 'Set the left rotation using quaternions or euler.',
                values: ['0,0,0,1'],
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#lefrotation',
            },
            RightRotation: {
                type: SchemaElementTypes.VECTOR,
                description: 'Set the right rotation using quaternions or euler.',
                values: ['0,0,0,1'],
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#righrotation',
            },
            Block: {
                type: SchemaElementTypes.ENUM,
                dataset: 'MATERIAL',
                description: 'The block (and state) to use for block displays.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#block',
            },
            Item: {
                type: SchemaElementTypes.STRING,
                description: 'The item to use for item displays.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#item',
            },
            Transform: {
                type: SchemaElementTypes.ENUM,
                description: 'The model transform applied to the item.',
                dataset: 'ITEMDISPLAYTRANSFORM',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#transform',
            },
            Text: {
                type: SchemaElementTypes.STRING,
                description: 'Set the text to show for text displays.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#text',
            },
            Opacity: {
                type: SchemaElementTypes.INTEGER,
                description: 'Set the text opacity, ranging from 0 to 255.',
                values: generateNumbersInRange(0, 255, 1, false),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#opacity',
            },
            DefaultBackground: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether to render using the default text background color.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#defaultbackground',
            },
            BackgroundColor: {
                type: SchemaElementTypes.STRING,
                description: 'Set the text background color.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#backgroundcolor',
            },
            Alignment: {
                type: SchemaElementTypes.ENUM,
                description: 'Set the text alignment.',
                dataset: 'TEXTALIGNMENT',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#alignment',
            },
            LineWidth: {
                type: SchemaElementTypes.INTEGER,
                description: 'The maximum line width used to split lines.',
                values: generateNumbersInRange(0, 500, 10, false),
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#linewidth',
            },
            Shadowed: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether the text should be displayed with a shadow.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#shadowed',
            },
            SeeThrough: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether the text should be visible through blocks.',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DisplayOptions#seethrough',
            },
        },
    },
};

ScribeEnumHandler.enumCallback.registerCallback('moboption', (target: AbstractScribeEnum) => {
    addMobOptions(target.getDataset());
});

function addMobOptions(options: Map<string, EnumDatasetValue>) {
    const mobOptions = getKeySchema((MobSchema.Options as KeySchemaElement).keys);
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

inheritSchemaOptions(
    MobSchema,
    'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs',
    DefaultPlugins.MythicMobs
);

function getMobVariables(): Schema {
    const cursorPosition = vscode.window.activeTextEditor?.selection.active;
    const activeDocument = vscode.window.activeTextEditor?.document;
    if (!cursorPosition || !activeDocument) {
        return {};
    }
    const mob = getRootKey(activeDocument, cursorPosition)?.key.trim();
    if (!mob) {
        return {};
    }
    const mobNode = MythicNodeHandler.registry.mob.getNode(mob);
    if (!mobNode) {
        return {};
    }
    const variables = (mobNode as MobMythicNode).missingVariables;

    const ret: Schema = {};
    variables.forEach((value) => {
        ret[value] = {
            type: SchemaElementTypes.STRING,
        };
    });
    return ret;
}
