import { getScribeEnumHandler } from '@common/datasets/ScribeEnum';
import { EnumDatasetValue } from '@common/datasets/types/Enum';

import {
    addSchemaAliases,
    generateNumbersInRange,
    generateVectorsInRange,
    inheritSchemaOptions,
} from '../utils/schemautils';
import {
    DefaultPlugins,
    Schema,
    SchemaElement,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
} from '../objectInfos';
import { DropsSchema } from './commonSchema';

export const Generation: Schema = {
    Generation: {
        type: SchemaElementTypes.KEY_LIST,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/ResourcePack-Generator',
        plugin: DefaultPlugins.MythicCrucible,
    },
};

const ConsumeEffects: Schema = {
    ConsumeEffects: {
        type: SchemaElementTypes.LIST,
        description: 'Effects to apply when the item is consumed',
        plugin: DefaultPlugins.MythicCrucible,
    },
};

const FurnitureStatesCompatibleOptions: Schema = {
    CanPlaceUnderwater: {
        type: SchemaElementTypes.BOOLEAN,
        plugin: DefaultPlugins.MythicCrucible,
    },
    GlowingFrame: {
        type: SchemaElementTypes.BOOLEAN,
        plugin: DefaultPlugins.MythicCrucible,
    },
    Lights: {
        type: SchemaElementTypes.LIST,
        entries: [
            {
                type: SchemaElementTypes.VECTOR,
                values: generateVectorsInRange(-1, 1, 1),
            },
        ],
        plugin: DefaultPlugins.MythicCrucible,
    },
    Barriers: {
        type: SchemaElementTypes.LIST,
        plugin: DefaultPlugins.MythicCrucible,
    },
    Model: {
        type: SchemaElementTypes.LIST,
        entries: [
            {
                type: SchemaElementTypes.VECTOR,
                values: generateVectorsInRange(-1, 1, 1),
            },
        ],
        plugin: DefaultPlugins.MythicCrucible,
    },
    CustomModelData: {
        type: SchemaElementTypes.INTEGER,
        plugin: DefaultPlugins.MythicCrucible,
        description: 'Sets the CustomModelData of the furniture (or furniture state)',
    },
    ...Generation,
};

const ItemAttributesEntries: Array<SchemaElement> = [
    {
        type: SchemaElementTypes.FLOAT,
        description: 'The amount to modify the attribute by',
        display: 'Amount',
        values: generateNumbersInRange(-10, 10, 0.5, true),
    },
    {
        type: SchemaElementTypes.ENUM,
        dataset: 'PAPERATTRIBUTEOPERATION',
    },
];

const ItemAttributes: Schema = {
    [SchemaElementSpecialKeys.ARRAYKEY]: {
        type: SchemaElementTypes.ENTRY_LIST,
        possibleKeyValues: () => {
            const dataset = getScribeEnumHandler().getEnum('mythicbukkitattributes')?.getDataset();
            if (dataset) {
                return dataset;
            }
            return new Map<string, EnumDatasetValue>();
        },
        display: 'New Item Attributes',
        entries: ItemAttributesEntries,
    },
};

const ItemOptions: Schema = {
    Options: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#options',
        description:
            'A special field that includes various item options, such as color or append type',
        keys: {
            Repairable: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#repairable',
                description:
                    'Sets the repair cost of the item to maximum, making it completely uneditable in anvils and/or enchantment tables. Defaults to false.',
            },
            RepairCost: {
                type: SchemaElementTypes.INTEGER,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#repaircost',
                description:
                    'Sets the repair cost of the item. If set to less than 0, the vanilla one will be used. Defaults to -1.',
            },
            Unbreakable: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#unbreakable',
                description:
                    'Sets the unbreakable tag on the item. Items with this set to true will not lose durability. Defaults to false.',
            },
            Glint: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#glint',
                description:
                    'Adds the enchantment glint visual effect to an item. Defaults to false.',
            },
            HideFlags: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#hideflags',
                description:
                    "Hides all the item flags, making things like enchants not visible in the item's lore. Defaults to false.",
            },
            PreventStacking: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#preventstacking',
                description: 'Prevents the item from stacking to similar items. Defaults to false.',
            },
            StackSize: {
                type: SchemaElementTypes.INTEGER,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#stacksize',
                description:
                    'Sets the maximum stack size of the item. Defaults to 64. If set to 1, the item will not stack.',
                values: generateNumbersInRange(1, 64, 1),
            },
            ItemModel: {
                type: SchemaElementTypes.STRING,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#itemmodel',
                description: 'The model that should be applied to the item.',
            },
            Player: {
                type: SchemaElementTypes.STRING,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#player',
                description:
                    'Sets the texture of the player head. The value must be the IGN of the target player.',
            },
            SkinTexture: {
                type: SchemaElementTypes.STRING,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#skintexture',
                description: 'Sets the texture of the player head using a SkinURL.',
            },
            Color: {
                type: SchemaElementTypes.ENUM,
                dataset: 'RGBCOLOR',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#color',
                description:
                    'Dyes the armor piece to a color according to RGB settings or a predefined color.',
            },
            GenerateUUID: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#generateuuid',
                description: 'Applies a random UUID to the item upon generation',
            },
            GenerateTimestamp: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#generatetimestamp',
                description: 'Applies a timestamp to the item upon generation',
            },
            FireResistant: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#fireresistant',
                description:
                    'Makes the item fire resistant, preventing it from burning in lava or fire',
            },
        },
    },
};

export const ItemSchema: Schema = {
    ...ItemOptions,
    ...Generation,
    Material: {
        type: SchemaElementTypes.ENUM,
        dataset: 'MATERIAL',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#id',
        description: 'The base material to use for your item',
    },
    Template: {
        type: SchemaElementTypes.ENUM,
        dataset: 'mythicitem',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#template',
        description:
            'Items can use Templating like mobs, while referencing other items. Only one template can be used at a time',
    },
    Display: {
        type: SchemaElementTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#display',
        description: 'Sets the display name of the item',
    },
    Lore: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#lore',
        description: 'Sets the lore of the item. Allows for placeholders and color gradients',
    },
    Model: {
        type: SchemaElementTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#custommodeldata',
        description: 'Sets the CustomModelData tag on the item',
    },
    MaxDurability: {
        type: SchemaElementTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#maxdurability',
        description: 'Sets the maximum durability of the item',
    },
    Durability: {
        type: SchemaElementTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#durability',
        description: 'Sets the amount of durability to take off the item',
    },
    Attributes: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Attributes',
        description:
            'Allows the addition of item attributes, such as health, to certain armor slots',
        keys: {
            All: {
                type: SchemaElementTypes.KEY,
                keys: ItemAttributes,
            },
            MainHand: {
                type: SchemaElementTypes.KEY,
                keys: ItemAttributes,
            },
            OffHand: {
                type: SchemaElementTypes.KEY,
                keys: ItemAttributes,
            },
            Head: {
                type: SchemaElementTypes.KEY,
                keys: ItemAttributes,
            },
            Chest: {
                type: SchemaElementTypes.KEY,
                keys: ItemAttributes,
            },
            Legs: {
                type: SchemaElementTypes.KEY,
                keys: ItemAttributes,
            },
            Feet: {
                type: SchemaElementTypes.KEY,
                keys: ItemAttributes,
            },
        },
    },
    Amount: {
        type: SchemaElementTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#amount',
        description:
            'Sets the default amount of items to give when this item is being called by the plugin',
        values: generateNumbersInRange(1, 12, 1),
    },
    Glider: {
        type: SchemaElementTypes.BOOLEAN,
        description:
            'If present, this item will be a glider. This is used for items like elytra, but can be used for any item',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#glider',
    },
    DeathProtection: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#deathprotection',
        description:
            'If present, this item protects the holder from dying by restoring a single health point, like a Totem of Undying does',
        keys: {
            ...ConsumeEffects,
        },
    },
    Enchantments: {
        type: SchemaElementTypes.LIST,
        dataset: 'ENCHANTMENT',
        values: generateNumbersInRange(1, 5, 1),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#enchantments',
        description:
            'Adds enchantments to items. A list of available enchantments is provided in the documentation',
    },
    Hide: {
        type: SchemaElementTypes.LIST,
        dataset: 'ITEMFLAG',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#hide',
        description:
            'Allows specific details, like enchantments, to be hidden from the item tooltip',
    },
    PotionEffects: {
        type: SchemaElementTypes.LIST,
        dataset: 'POTIONEFFECTTYPE',
        values: generateNumbersInRange(20, 200, 20),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#potioneffects',
        description:
            'Sets the potion effects of the item, applicable to potions, splash potions, and tipped arrows',
    },
    BannerLayers: {
        type: SchemaElementTypes.LIST,
        dataset: 'DYE',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#bannerlayers',
        description: 'Sets the banner layers for a banner or shield',
    },
    CanPlaceOn: {
        type: SchemaElementTypes.LIST,
        dataset: 'MATERIAL',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#canplaceon',
        description: 'Specifies blocks on which this item can be placed in adventure mode',
    },
    CanBreak: {
        type: SchemaElementTypes.LIST,
        dataset: 'MATERIAL',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#canbreak',
        description: 'Specifies blocks that this item can break in adventure mode',
    },
    Group: {
        type: SchemaElementTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#group',
        description: "Defines the group for browsing items with '/mm items browse'",
    },
    NBT: {
        type: SchemaElementTypes.KEY_LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#nbt',
        description:
            'Adds custom NBT tags to items for data storage or compatibility with other plugins',
    },
    Trim: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#key',
        description:
            'Sets custom armor trim for items, like iron chestplates, with specified materials and patterns',
        keys: {
            Material: {
                type: SchemaElementTypes.ENUM,
                dataset: 'MATERIAL',
            },
            Pattern: {
                type: SchemaElementTypes.STRING,
            },
        },
    },
    Rarity: {
        type: SchemaElementTypes.ENUM,
        dataset: 'ITEMRARITY',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#rarity',
        description: 'Sets the rarity of the item',
    },
    Firework: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Firework',
        description:
            'Configures firework or firework_charge items with colors, flicker, trail, etc.',
        keys: {
            Colors: {
                type: SchemaElementTypes.LIST,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Firework#colors',
                description: 'Sets the colors of the firework',
            },
            FadeColors: {
                type: SchemaElementTypes.LIST,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Firework#fadecolors',
                description: 'Sets the fade colors of the firework',
            },
            Flicker: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Firework#flicker',
                description: 'Sets the flicker of the firework',
            },
            Trail: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Firework#trail',
                description: 'Sets the trail of the firework',
            },
        },
    },
    Title: {
        type: SchemaElementTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#book',
        description: 'The title of the book',
    },
    Author: {
        type: SchemaElementTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#book',
        description: 'The author of the book',
    },
    Pages: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#book',
        description: 'The pages of the book',
    },
    Consumable: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#consumable',
        description: 'Allows item to be eaten. Includes customizable animations and sounds.',
        keys: {
            ConsumeSeconds: {
                type: SchemaElementTypes.INTEGER,
                description: 'The time in seconds it takes to consume the item',
            },
            HasParticles: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether to show particles when the item is consumed',
            },
            Animation: {
                type: SchemaElementTypes.ENUM,
                dataset: 'itemuseanimation',
            },
            Sound: {
                type: SchemaElementTypes.ENUM,
                dataset: 'SOUND',
            },
            ...ConsumeEffects,
        },
    },
    Food: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#food',
        description:
            'Configures food items with attributes like nutrition, saturation, and effects',
        keys: {
            Nutrition: {
                type: SchemaElementTypes.FLOAT,
                values: generateNumbersInRange(1, 20, 1),
            },
            Saturation: {
                type: SchemaElementTypes.FLOAT,
                values: generateNumbersInRange(1, 20, 1),
            },
            CanAlwaysEat: {
                type: SchemaElementTypes.BOOLEAN,
            },
        },
    },
    Equippable: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#equippable',
        description: 'Used to handle the equippable item component of an item',
        keys: {
            Slot: {
                type: SchemaElementTypes.ENUM,
                dataset: 'EQUIPSLOT',
                description: 'The slot where the item can be equipped',
            },
            Model: {
                type: SchemaElementTypes.STRING,
                description: 'The model of the item when equipped',
            },
            CameraOverlay: {
                type: SchemaElementTypes.STRING,
                description:
                    'The resource location of the overlay texture to use when equipped. If a namespace is not used, it will default to `minecraft:`',
            },
            Dispensable: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether the item can be dispensed',
            },
            Swappable: {
                type: SchemaElementTypes.BOOLEAN,
                description:
                    'Whether the item can be equipped into the relevant slot by right-clicking',
            },
            DamageOnHurt: {
                type: SchemaElementTypes.BOOLEAN,
                description: 'Whether this item is damaged when the wearing entity is damaged',
            },
            EquipSound: {
                type: SchemaElementTypes.ENUM,
                dataset: 'SOUND',
                description: 'The sound to play when the item is equipped',
            },
            EntityTypes: {
                type: SchemaElementTypes.LIST,
                dataset: 'ENTITYTYPE',
                description: 'The entity types that can wear this item',
            },
        },
    },
    UseCooldown: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#usecooldown',
        description: 'Used to handle the use_cooldown item component of an item',
        keys: {
            CooldownGroup: {
                type: SchemaElementTypes.STRING,
                description:
                    'The unique resource location to identify this cooldown group. If present, the item is included in a cooldown group and no longer shares cooldowns with its base item type, but instead with any other items that are part of the same cooldown group. If a namespace is not used, it will default to minecraft:',
            },
            CooldownSeconds: {
                type: SchemaElementTypes.INTEGER,
                description:
                    'The cooldown duration in seconds. Must be an integer, so the cooldown cannot be defined up to the tick',
            },
        },
    },
    Tool: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#tool',
        description: 'Used to handle the tool item component of an item',
        keys: {
            DamagePerBlock: {
                type: SchemaElementTypes.INTEGER,
                values: generateNumbersInRange(1, 10, 1),
                description:
                    'The amount of durability to remove each time a block is broken with this tool. Must be a non-negative integer',
            },
            DefaultMiningSpeed: {
                type: SchemaElementTypes.FLOAT,
                values: generateNumbersInRange(1, 10, 0.5, true),
                description: 'The default mining speed of this tool, used if no rule overrides it',
            },
            Rules: {
                type: SchemaElementTypes.LIST,
                description: 'A list of rules for the tool',
            },
        },
    },
    Skills: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Usage',
        description: 'Sets the skills of the item',
        plugin: DefaultPlugins.MythicCrucible,
    },
    FurnitureSkills: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture#furniture-skills',
        description: 'Sets the furniture skills of the item',
        plugin: DefaultPlugins.MythicCrucible,
    },
    CustomBlockSkills: {
        type: SchemaElementTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Custom-Blocks',
        description: 'Sets the custom block skills of the item',
        plugin: DefaultPlugins.MythicCrucible,
    },
    CustomDurability: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/CustomDurability',
        description: 'Sets the custom durability of the item',
        plugin: DefaultPlugins.MythicCrucible,
        keys: {
            Durability: {
                type: SchemaElementTypes.INTEGER,
            },
        },
    },
    Recipes: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Recipes',
        description: 'Sets the recipes of the item',
        plugin: DefaultPlugins.MythicCrucible,
        keys: {
            [SchemaElementSpecialKeys.WILDKEY]: {
                type: SchemaElementTypes.KEY,
                description: 'Sets the recipe of the item',
                display: 'Set the Internal Name for the Recipe',
                keys: {
                    Type: {
                        type: SchemaElementTypes.STRING,
                    },
                    Amount: {
                        type: SchemaElementTypes.INTEGER,
                    },
                    Ingredients: {
                        type: SchemaElementTypes.LIST,
                    },
                },
            },
        },
    },
    AugmentationSlots: {
        type: SchemaElementTypes.KEY_LIST,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Augments',
        description: 'Sets the augmentation slots of the item',
        plugin: DefaultPlugins.MythicCrucible,
    },
    EquipmentSet: {
        type: SchemaElementTypes.ENUM,
        dataset: 'EQUIPMENTSET',
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Sets',
        description: 'Sets the set of the item',
        plugin: DefaultPlugins.MythicCrucible,
    },
    CustomBlock: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Custom-Blocks',
        description: 'Sets the custom block of the item',
        plugin: DefaultPlugins.MythicCrucible,
        keys: {
            Type: {
                type: SchemaElementTypes.STRING,
            },
            Id: {
                type: SchemaElementTypes.INTEGER,
            },
            Texture: {
                type: SchemaElementTypes.STRING,
            },
            Hardness: {
                type: SchemaElementTypes.INTEGER,
            },
            Tools: {
                type: SchemaElementTypes.LIST,
            },
            Parent: {
                type: SchemaElementTypes.STRING,
            },
            Textures: {
                type: SchemaElementTypes.KEY_LIST,
            },
            Variant: {
                type: SchemaElementTypes.LIST,
            },
        },
    },
    Type: {
        type: SchemaElementTypes.ENUM,
        dataset: 'ITEMTYPE',
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis',
        description: 'Sets the type of the item',
        plugin: DefaultPlugins.MythicCrucible,
    },
    Furniture: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture',
        description: 'Sets the furniture of the item',
        plugin: DefaultPlugins.MythicCrucible,
        keys: {
            Material: {
                type: SchemaElementTypes.ENUM,
                dataset: 'MATERIAL',
            },
            Type: {
                type: SchemaElementTypes.ENUM,
                dataset: 'FURNITURETYPE',
            },
            Health: {
                type: SchemaElementTypes.INTEGER,
            },
            Hitbox: {
                type: SchemaElementTypes.KEY,
                keys: {
                    Height: {
                        type: SchemaElementTypes.INTEGER,
                    },
                    Width: {
                        type: SchemaElementTypes.INTEGER,
                    },
                },
            },
            CanRotate: {
                type: SchemaElementTypes.BOOLEAN,
            },
            GlowingItem: {
                type: SchemaElementTypes.BOOLEAN,
            },
            DropSelf: {
                type: SchemaElementTypes.BOOLEAN,
            },
            Color: {
                dataset: 'RGBCOLOR',
                type: SchemaElementTypes.ENUM,
            },
            Colorable: {
                type: SchemaElementTypes.BOOLEAN,
            },
            Placement: {
                type: SchemaElementTypes.ENUM,
                dataset: 'FURNITUREPLACEMENT',
            },
            Orientation: {
                type: SchemaElementTypes.ENUM,
                dataset: 'FURNITUREORIENTATION',
            },
            Diagonalable: {
                type: SchemaElementTypes.BOOLEAN,
            },
            Seats: {
                type: SchemaElementTypes.LIST,
                entries: [
                    {
                        type: SchemaElementTypes.VECTOR,
                        values: generateVectorsInRange(-1, 1, 1),
                    },
                ],
            },
            Drops: {
                ...DropsSchema,
            },
            DefaultState: {
                type: SchemaElementTypes.STRING,
            },
            States: {
                type: SchemaElementTypes.KEY,
                keys: {
                    [SchemaElementSpecialKeys.WILDKEY]: {
                        type: SchemaElementTypes.KEY,
                        display: 'Set the Internal Name for the State',
                        keys: FurnitureStatesCompatibleOptions,
                    },
                },
            },
            Height: {
                type: SchemaElementTypes.INTEGER,
            },
            Width: {
                type: SchemaElementTypes.INTEGER,
            },
            Billboard: {
                type: SchemaElementTypes.STRING,
            },
            Brightness: {
                type: SchemaElementTypes.INTEGER,
            },
            InterpolationDelay: {
                type: SchemaElementTypes.INTEGER,
            },
            InterpolationDuration: {
                type: SchemaElementTypes.INTEGER,
            },
            Transform: {
                type: SchemaElementTypes.STRING,
            },
            Scale: {
                type: SchemaElementTypes.VECTOR,
                values: generateVectorsInRange(0.1, 2, 0.1),
            },
            Tracked: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture#tracked',
                description: 'Whether the furniture should be actively tracked by the plugin',
            },
            KeepVariablesOnDrop: {
                type: SchemaElementTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture#keepvariablesondrop',
                description: 'Whether the furniture should keep its variables when dropped',
            },
            Variables: {
                type: SchemaElementTypes.KEY_LIST,
                link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture#variables',
                description: 'The variables of the furniture.',
            },
            KillMessages: {
                type: SchemaElementTypes.LIST,
                link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture#killmessages',
                description: 'Messages to display when the furniture kills a player.',
            },
            ...FurnitureStatesCompatibleOptions,
        },
    },
    Inventory: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Bags',
        description: 'Sets the bag options',
        plugin: DefaultPlugins.MythicCrucible,
        keys: {
            Title: {
                type: SchemaElementTypes.STRING,
            },
            Size: {
                type: SchemaElementTypes.INTEGER,
                values: generateNumbersInRange(9, 54, 9),
            },
        },
    },
    Spawner: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#spawner',
        description: 'Configures the spawner settings for the item',
        keys: {
            Delay: {
                type: SchemaElementTypes.INTEGER,
            },
            MinSpawnDelay: {
                type: SchemaElementTypes.INTEGER,
            },
            MaxSpawnDelay: {
                type: SchemaElementTypes.INTEGER,
            },
            RequiredPlayerRange: {
                type: SchemaElementTypes.INTEGER,
            },
            SpawnCount: {
                type: SchemaElementTypes.INTEGER,
            },
            SpawnRange: {
                type: SchemaElementTypes.INTEGER,
            },
            MaxNearbyEntities: {
                type: SchemaElementTypes.INTEGER,
            },
            Mobs: {
                type: SchemaElementTypes.LIST,
                keys: {
                    Type: {
                        type: SchemaElementTypes.STRING,
                    },
                    Weight: {
                        type: SchemaElementTypes.INTEGER,
                    },
                    MinBlockLight: {
                        type: SchemaElementTypes.INTEGER,
                    },
                    MaxBlockLight: {
                        type: SchemaElementTypes.INTEGER,
                    },
                    MinSkyLight: {
                        type: SchemaElementTypes.INTEGER,
                    },
                    MaxSkyLight: {
                        type: SchemaElementTypes.INTEGER,
                    },
                },
            },
        },
    },
    TooltipStyle: {
        type: SchemaElementTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#tooltipstyle',
        description: 'Configures the tooltip style for the item',
    },
    DropOptions: {
        type: SchemaElementTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#dropoptions',
        description: 'Default drop settings for this item',
        keys: {
            DropGlowColor: {
                dataset: 'COLOR',
                type: SchemaElementTypes.ENUM,
            },
            DropBeamColor: {
                dataset: 'COLOR',
                type: SchemaElementTypes.ENUM,
            },
            DropLootsplosion: {
                type: SchemaElementTypes.BOOLEAN,
            },
            DropHologram: {
                type: SchemaElementTypes.BOOLEAN,
            },
            DropVFX: {
                type: SchemaElementTypes.BOOLEAN,
            },
            DropVFXMaterial: {
                type: SchemaElementTypes.STRING,
            },
            DropVFXData: {
                type: SchemaElementTypes.INTEGER,
            },
            DropVFXColor: {
                dataset: 'COLOR',
                type: SchemaElementTypes.ENUM,
            },
            DropBillboarding: {
                type: SchemaElementTypes.STRING,
            },
            DropBrightness: {
                type: SchemaElementTypes.INTEGER,
            },
            DropClientSide: {
                type: SchemaElementTypes.BOOLEAN,
            },
        },
    },
    BlockStates: {
        type: SchemaElementTypes.LIST,
        description: 'Allows you to specify the block states of items',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#blockstates',
    },
    ArrowDamage: {
        type: SchemaElementTypes.FLOAT,
        description:
            'The damage the arrows fired from this item will do. Does not influence other projectile types',
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Items#arrowdamage',
        plugin: DefaultPlugins.MythicCrucible,
    },
    EquipSlot: {
        type: SchemaElementTypes.ENUM,
        dataset: 'EQUIPSLOT',
        description:
            'The Slot where the equipment is supposed to be used. If used elsewhere, its Stats will not apply',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#equipslot',
        plugin: DefaultPlugins.MythicCrucible,
    },
    EquipSlotSkill: {
        type: SchemaElementTypes.ENUM,
        dataset: 'METASKILL',
        description:
            'The MetaSkill to be executed once the item is equipped in the correct slot, if any.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#equipslotskill',
        plugin: DefaultPlugins.MythicCrucible,
    },
    EquipConditions: {
        type: SchemaElementTypes.LIST,
        description:
            'A list of Conditions to be matched in order for the item to apply its stats once equipped.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#equipconditions',
        plugin: DefaultPlugins.MythicCrucible,
    },
    EquipLevel: {
        type: SchemaElementTypes.INTEGER,
        description:
            'The required level the player must be at in order for the item to apply its stats once equipped. Defaults to 0.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#equiplevel',
        plugin: DefaultPlugins.MythicCrucible,
    },
    EquipLevelSkill: {
        type: SchemaElementTypes.ENUM,
        dataset: 'METASKILL',
        description:
            'The MetaSkill to be executed once the item is equipped with the correct level',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#equiplevelskill',
        plugin: DefaultPlugins.MythicCrucible,
    },
    EquipLevelKey: {
        type: SchemaElementTypes.STRING,
        description:
            "The key of the Player Level Provider to be used to evaluate the player's level. Defaults to evaluating the player's vanilla experience level",
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#equiplevelkey',
        plugin: DefaultPlugins.MythicCrucible,
    },
};

addSchemaAliases(ItemSchema, {
    Material: ['Id'],
    Model: ['CustomModelData'],
    Group: ['ItemType'],
});

inheritSchemaOptions(
    ItemSchema,
    'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items',
    DefaultPlugins.MythicMobs
);

inheritSchemaOptions(
    Generation,
    'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/ResourcePack-Generator',
    DefaultPlugins.MythicCrucible
);

// globalCallbacks.activation.registerCallback('post-activation', () => {
//     initItemSchema();
// });

// export function initItemSchema(): void {
//     getScribeEnumHandler()
//         .enumCallback.register('mythicbukkitattributes')
//         .then((enumDataset) => {
//             const defaultSchemaElement: SchemaElement = {
//                 type: SchemaElementTypes.ENTRY_LIST,
//                 entries: ItemAttributesEntries,
//             };
//             for (const attribute of enumDataset.getDataset().keys()) {
//                 ItemAttributes[attribute] = defaultSchemaElement;
//             }
//             return;
//         });
// }
