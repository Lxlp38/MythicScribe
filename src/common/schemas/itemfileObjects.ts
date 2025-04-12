import { addFileObjectAliases, generateNumbersInRange } from '../utils/schemautils';
import { FileObjectMap, FileObjectSpecialKeys, FileObjectTypes } from '../objectInfos';

const Generation: FileObjectMap = {
    Generation: {
        type: FileObjectTypes.KEY_LIST,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/ResourcePack-Generator',
    },
};

const ConsumeEffects: FileObjectMap = {
    ConsumeEffects: {
        type: FileObjectTypes.LIST,
        description: 'Effects to apply when the item is consumed',
    },
};

const FurnitureStatesCompatibleOptions: FileObjectMap = {
    CanPlaceUnderwater: {
        type: FileObjectTypes.BOOLEAN,
    },
    GlowingFrame: {
        type: FileObjectTypes.BOOLEAN,
    },
    Lights: {
        type: FileObjectTypes.LIST,
    },
    Barriers: {
        type: FileObjectTypes.LIST,
    },
    Model: {
        type: FileObjectTypes.INTEGER,
    },
    ...Generation,
};

export const ItemFileObjects: FileObjectMap = {
    Material: {
        type: FileObjectTypes.ENUM,
        dataset: 'MATERIAL',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#id',
        description: 'The base material to use for your item',
    },
    Template: {
        type: FileObjectTypes.ENUM,
        dataset: 'mythicitem',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#template',
        description:
            'Items can use Templating like mobs, while referencing other items. Only one template can be used at a time',
    },
    Display: {
        type: FileObjectTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#display',
        description: 'Sets the display name of the item',
    },
    Lore: {
        type: FileObjectTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#lore',
        description: 'Sets the lore of the item. Allows for placeholders and color gradients',
    },
    Model: {
        type: FileObjectTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#custommodeldata',
        description: 'Sets the CustomModelData tag on the item',
    },
    MaxDurability: {
        type: FileObjectTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#maxdurability',
        description: 'Sets the maximum durability of the item',
    },
    Durability: {
        type: FileObjectTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#durability',
        description: 'Sets the amount of durability to take off the item',
    },
    Attributes: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#attributes',
        description:
            'Allows the addition of item attributes, such as health, to certain armor slots',
        keys: {
            All: {
                type: FileObjectTypes.KEY_LIST,
            },
            MainHand: {
                type: FileObjectTypes.KEY_LIST,
            },
            OffHand: {
                type: FileObjectTypes.KEY_LIST,
            },
            Head: {
                type: FileObjectTypes.KEY_LIST,
            },
            Chest: {
                type: FileObjectTypes.KEY_LIST,
            },
            Legs: {
                type: FileObjectTypes.KEY_LIST,
            },
            Feet: {
                type: FileObjectTypes.KEY_LIST,
            },
        },
    },
    Amount: {
        type: FileObjectTypes.INTEGER,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#amount',
        description:
            'Sets the default amount of items to give when this item is being called by the plugin',
        values: generateNumbersInRange(1, 12, 1),
    },
    Options: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#options',
        description:
            'A special field that includes various item options, such as color or append type',
        keys: {
            Repairable: {
                type: FileObjectTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#repairable',
                description:
                    'Sets the repair cost of the item to maximum, making it completely uneditable in anvils and/or enchantment tables. Defaults to false.',
            },
            RepairCost: {
                type: FileObjectTypes.INTEGER,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#repaircost',
                description:
                    'Sets the repair cost of the item. If set to less than 0, the vanilla one will be used. Defaults to -1.',
            },
            Unbreakable: {
                type: FileObjectTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#unbreakable',
                description:
                    'Sets the unbreakable tag on the item. Items with this set to true will not lose durability. Defaults to false.',
            },
            Glint: {
                type: FileObjectTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#glint',
                description:
                    'Adds the enchantment glint visual effect to an item. Defaults to false.',
            },
            HideFlags: {
                type: FileObjectTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#hideflags',
                description:
                    "Hides all the item flags, making things like enchants not visible in the item's lore. Defaults to false.",
            },
            PreventStacking: {
                type: FileObjectTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#preventstacking',
                description: 'Prevents the item from stacking to similar items. Defaults to false.',
            },
            ItemModel: {
                type: FileObjectTypes.STRING,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#itemmodel',
                description: 'The model that should be applied to the item.',
            },
            Player: {
                type: FileObjectTypes.STRING,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#player',
                description:
                    'Sets the texture of the player head. The value must be the IGN of the target player.',
            },
            SkinTexture: {
                type: FileObjectTypes.STRING,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#skintexture',
                description: 'Sets the texture of the player head using a SkinURL.',
            },
            Color: {
                type: FileObjectTypes.ENUM,
                dataset: 'RGBCOLOR',
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#color',
                description:
                    'Dyes the armor piece to a color according to RGB settings or a predefined color.',
            },
        },
    },
    Glider: {
        type: FileObjectTypes.BOOLEAN,
        description:
            'If present, this item will be a glider. This is used for items like elytra, but can be used for any item',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#glider',
    },
    DeathProtection: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#deathprotection',
        description:
            'If present, this item protects the holder from dying by restoring a single health point, like a Totem of Undying does',
        keys: {
            ...ConsumeEffects,
        },
    },
    Enchantments: {
        type: FileObjectTypes.LIST,
        dataset: 'ENCHANTMENT',
        values: generateNumbersInRange(1, 5, 1),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#enchantments',
        description:
            'Adds enchantments to items. A list of available enchantments is provided in the documentation',
    },
    Hide: {
        type: FileObjectTypes.LIST,
        dataset: 'ITEMFLAG',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#hide',
        description:
            'Allows specific details, like enchantments, to be hidden from the item tooltip',
    },
    PotionEffects: {
        type: FileObjectTypes.LIST,
        dataset: 'POTIONEFFECTTYPE',
        values: generateNumbersInRange(20, 200, 20),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#potioneffects',
        description:
            'Sets the potion effects of the item, applicable to potions, splash potions, and tipped arrows',
    },
    BannerLayers: {
        type: FileObjectTypes.LIST,
        dataset: 'DYE',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#bannerlayers',
        description: 'Sets the banner layers for a banner or shield',
    },
    CanPlaceOn: {
        type: FileObjectTypes.LIST,
        dataset: 'MATERIAL',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#canplaceon',
        description: 'Specifies blocks on which this item can be placed in adventure mode',
    },
    CanBreak: {
        type: FileObjectTypes.LIST,
        dataset: 'MATERIAL',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#canbreak',
        description: 'Specifies blocks that this item can break in adventure mode',
    },
    Group: {
        type: FileObjectTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#group',
        description: "Defines the group for browsing items with '/mm items browse'",
    },
    NBT: {
        type: FileObjectTypes.KEY_LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#nbt',
        description:
            'Adds custom NBT tags to items for data storage or compatibility with other plugins',
    },
    Trim: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#key',
        description:
            'Sets custom armor trim for items, like iron chestplates, with specified materials and patterns',
        keys: {
            Material: {
                type: FileObjectTypes.ENUM,
                dataset: 'MATERIAL',
            },
            Pattern: {
                type: FileObjectTypes.STRING,
            },
        },
    },
    Rarity: {
        type: FileObjectTypes.ENUM,
        dataset: 'ITEMRARITY',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#rarity',
        description: 'Sets the rarity of the item',
    },
    Firework: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Firework',
        description:
            'Configures firework or firework_charge items with colors, flicker, trail, etc.',
        keys: {
            Colors: {
                type: FileObjectTypes.LIST,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Firework#colors',
                description: 'Sets the colors of the firework',
            },
            FadeColors: {
                type: FileObjectTypes.LIST,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Firework#fadecolors',
                description: 'Sets the fade colors of the firework',
            },
            Flicker: {
                type: FileObjectTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Firework#flicker',
                description: 'Sets the flicker of the firework',
            },
            Trail: {
                type: FileObjectTypes.BOOLEAN,
                link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Firework#trail',
                description: 'Sets the trail of the firework',
            },
        },
    },
    Title: {
        type: FileObjectTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#book',
        description: 'The title of the book',
    },
    Author: {
        type: FileObjectTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#book',
        description: 'The author of the book',
    },
    Pages: {
        type: FileObjectTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#book',
        description: 'The pages of the book',
    },
    Consumable: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Options#consumable',
        description: 'Allows item to be eaten. Includes customizable animations and sounds.',
        keys: {
            ConsumeSeconds: {
                type: FileObjectTypes.INTEGER,
            },
            HasParticles: {
                type: FileObjectTypes.BOOLEAN,
            },
            Animation: {
                type: FileObjectTypes.ENUM,
                dataset: 'itemuseanimation',
            },
            Sound: {
                type: FileObjectTypes.ENUM,
                dataset: 'SOUND',
            },
            ...ConsumeEffects,
        },
    },
    Food: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#food',
        description:
            'Configures food items with attributes like nutrition, saturation, and effects',
        keys: {
            Nutrition: {
                type: FileObjectTypes.FLOAT,
                values: generateNumbersInRange(1, 20, 1),
            },
            Saturation: {
                type: FileObjectTypes.FLOAT,
                values: generateNumbersInRange(1, 20, 1),
            },
            CanAlwaysEat: {
                type: FileObjectTypes.BOOLEAN,
            },
        },
    },
    Equippable: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#equippable',
        description: 'Used to handle the equippable item component of an item',
        keys: {
            Slot: {
                type: FileObjectTypes.ENUM,
                dataset: 'EQUIPSLOT',
                description: 'The slot where the item can be equipped',
            },
            Model: {
                type: FileObjectTypes.STRING,
                description: 'The model of the item when equipped',
            },
            CameraOverlay: {
                type: FileObjectTypes.STRING,
                description:
                    'The resource location of the overlay texture to use when equipped. If a namespace is not used, it will default to `minecraft:`',
            },
            Dispensable: {
                type: FileObjectTypes.BOOLEAN,
                description: 'Whether the item can be dispensed',
            },
            Swappable: {
                type: FileObjectTypes.BOOLEAN,
                description:
                    'Whether the item can be equipped into the relevant slot by right-clicking',
            },
            DamageOnHurt: {
                type: FileObjectTypes.BOOLEAN,
                description: 'Whether this item is damaged when the wearing entity is damaged',
            },
            EquipSound: {
                type: FileObjectTypes.ENUM,
                dataset: 'SOUND',
                description: 'The sound to play when the item is equipped',
            },
            EntityTypes: {
                type: FileObjectTypes.LIST,
                dataset: 'ENTITYTYPE',
                description: 'The entity types that can wear this item',
            },
        },
    },
    UseCooldown: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#usecooldown',
        description: 'Used to handle the use_cooldown item component of an item',
        keys: {
            CooldownGroup: {
                type: FileObjectTypes.STRING,
                description:
                    'The unique resource location to identify this cooldown group. If present, the item is included in a cooldown group and no longer shares cooldowns with its base item type, but instead with any other items that are part of the same cooldown group. If a namespace is not used, it will default to minecraft:',
            },
            CooldownSeconds: {
                type: FileObjectTypes.INTEGER,
                description:
                    'The cooldown duration in seconds. Must be an integer, so the cooldown cannot be defined up to the tick',
            },
        },
    },
    Tool: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#tool',
        description: 'Used to handle the tool item component of an item',
        keys: {
            DamagePerBlock: {
                type: FileObjectTypes.INTEGER,
                values: generateNumbersInRange(1, 10, 1),
                description:
                    'The amount of durability to remove each time a block is broken with this tool. Must be a non-negative integer',
            },
            DefaultMiningSpeed: {
                type: FileObjectTypes.FLOAT,
                values: generateNumbersInRange(1, 10, 0.5, true),
                description: 'The default mining speed of this tool, used if no rule overrides it',
            },
            Rules: {
                type: FileObjectTypes.LIST,
                description: 'A list of rules for the tool',
            },
        },
    },
    Skills: {
        type: FileObjectTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Usage',
        description: 'Sets the skills of the item',
    },
    FurnitureSkills: {
        type: FileObjectTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture#furniture-skills',
        description: 'Sets the furniture skills of the item',
    },
    CustomBlockSkills: {
        type: FileObjectTypes.LIST,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Custom-Blocks',
        description: 'Sets the custom block skills of the item',
    },
    CustomDurability: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/CustomDurability',
        description: 'Sets the custom durability of the item',
        keys: {
            Durability: {
                type: FileObjectTypes.INTEGER,
            },
        },
    },
    Recipes: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Recipes',
        description: 'Sets the recipes of the item',
        keys: {
            [FileObjectSpecialKeys.WILDKEY]: {
                type: FileObjectTypes.KEY,
                description: 'Sets the recipe of the item',
                display: 'Set the Internal Name for the Recipe',
                keys: {
                    Type: {
                        type: FileObjectTypes.STRING,
                    },
                    Amount: {
                        type: FileObjectTypes.INTEGER,
                    },
                    Ingredients: {
                        type: FileObjectTypes.LIST,
                    },
                },
            },
        },
    },
    AugmentationSlots: {
        type: FileObjectTypes.KEY_LIST,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Augments',
        description: 'Sets the augmentation slots of the item',
    },
    EquipmentSet: {
        type: FileObjectTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Sets',
        description: 'Sets the set of the item',
    },
    CustomBlock: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Custom-Blocks',
        description: 'Sets the custom block of the item',
        keys: {
            Type: {
                type: FileObjectTypes.STRING,
            },
            Id: {
                type: FileObjectTypes.INTEGER,
            },
            Texture: {
                type: FileObjectTypes.STRING,
            },
            Hardness: {
                type: FileObjectTypes.INTEGER,
            },
            Tools: {
                type: FileObjectTypes.LIST,
            },
            Parent: {
                type: FileObjectTypes.STRING,
            },
            Textures: {
                type: FileObjectTypes.KEY_LIST,
            },
            Variant: {
                type: FileObjectTypes.LIST,
            },
        },
    },
    Type: {
        type: FileObjectTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis',
        description: 'Sets the type of the item',
    },
    Furniture: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture',
        description: 'Sets the furniture of the item',
        keys: {
            Material: {
                type: FileObjectTypes.ENUM,
                dataset: 'MATERIAL',
            },
            Type: {
                type: FileObjectTypes.ENUM,
                dataset: 'FURNITURETYPE',
            },
            Health: {
                type: FileObjectTypes.INTEGER,
            },
            Hitbox: {
                type: FileObjectTypes.KEY,
                keys: {
                    Height: {
                        type: FileObjectTypes.INTEGER,
                    },
                    Width: {
                        type: FileObjectTypes.INTEGER,
                    },
                },
            },
            CanRotate: {
                type: FileObjectTypes.BOOLEAN,
            },
            GlowingItem: {
                type: FileObjectTypes.BOOLEAN,
            },
            DropSelf: {
                type: FileObjectTypes.BOOLEAN,
            },
            Color: {
                dataset: 'RGBCOLOR',
                type: FileObjectTypes.ENUM,
            },
            Colorable: {
                type: FileObjectTypes.BOOLEAN,
            },
            Placement: {
                type: FileObjectTypes.ENUM,
                dataset: 'FURNITUREPLACEMENT',
            },
            Orientation: {
                type: FileObjectTypes.ENUM,
                dataset: 'FURNITUREORIENTATION',
            },
            Diagonalable: {
                type: FileObjectTypes.BOOLEAN,
            },
            Seats: {
                type: FileObjectTypes.LIST,
            },
            Drops: {
                type: FileObjectTypes.LIST,
            },
            DefaultState: {
                type: FileObjectTypes.STRING,
            },
            States: {
                type: FileObjectTypes.KEY,
                keys: {
                    [FileObjectSpecialKeys.WILDKEY]: {
                        type: FileObjectTypes.KEY,
                        display: 'Set the Internal Name for the State',
                        keys: FurnitureStatesCompatibleOptions,
                    },
                },
            },
            Height: {
                type: FileObjectTypes.INTEGER,
            },
            Width: {
                type: FileObjectTypes.INTEGER,
            },
            Billboard: {
                type: FileObjectTypes.STRING,
            },
            Brightness: {
                type: FileObjectTypes.INTEGER,
            },
            InterpolationDelay: {
                type: FileObjectTypes.INTEGER,
            },
            InterpolationDuration: {
                type: FileObjectTypes.INTEGER,
            },
            Transform: {
                type: FileObjectTypes.STRING,
            },
            Scale: {
                type: FileObjectTypes.VECTOR,
            },
            ...FurnitureStatesCompatibleOptions,
        },
    },
    Inventory: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Bags',
        description: 'Thets the bag options',
        keys: {
            Title: {
                type: FileObjectTypes.STRING,
            },
            Size: {
                type: FileObjectTypes.INTEGER,
                values: generateNumbersInRange(9, 54, 9),
            },
        },
    },
    Spawner: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#spawner',
        description: 'Configures the spawner settings for the item',
        keys: {
            Delay: {
                type: FileObjectTypes.INTEGER,
            },
            MinSpawnDelay: {
                type: FileObjectTypes.INTEGER,
            },
            MaxSpawnDelay: {
                type: FileObjectTypes.INTEGER,
            },
            RequiredPlayerRange: {
                type: FileObjectTypes.INTEGER,
            },
            SpawnCount: {
                type: FileObjectTypes.INTEGER,
            },
            SpawnRange: {
                type: FileObjectTypes.INTEGER,
            },
            MaxNearbyEntities: {
                type: FileObjectTypes.INTEGER,
            },
            Mobs: {
                type: FileObjectTypes.LIST,
                keys: {
                    Type: {
                        type: FileObjectTypes.STRING,
                    },
                    Weight: {
                        type: FileObjectTypes.INTEGER,
                    },
                    MinBlockLight: {
                        type: FileObjectTypes.INTEGER,
                    },
                    MaxBlockLight: {
                        type: FileObjectTypes.INTEGER,
                    },
                    MinSkyLight: {
                        type: FileObjectTypes.INTEGER,
                    },
                    MaxSkyLight: {
                        type: FileObjectTypes.INTEGER,
                    },
                },
            },
        },
    },
    TooltipStyle: {
        type: FileObjectTypes.STRING,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#tooltipstyle',
        description: 'Configures the tooltip style for the item',
    },
    DropOptions: {
        type: FileObjectTypes.KEY,
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#dropoptions',
        description: 'Default drop settings for this item',
        keys: {
            DropGlowColor: {
                dataset: 'COLOR',
                type: FileObjectTypes.ENUM,
            },
            DropBeamColor: {
                dataset: 'COLOR',
                type: FileObjectTypes.ENUM,
            },
            DropLootsplosion: {
                type: FileObjectTypes.BOOLEAN,
            },
            DropHologram: {
                type: FileObjectTypes.BOOLEAN,
            },
            DropVFX: {
                type: FileObjectTypes.BOOLEAN,
            },
            DropVFXMaterial: {
                type: FileObjectTypes.STRING,
            },
            DropVFXData: {
                type: FileObjectTypes.INTEGER,
            },
            DropVFXColor: {
                dataset: 'COLOR',
                type: FileObjectTypes.ENUM,
            },
            DropBillboarding: {
                type: FileObjectTypes.STRING,
            },
            DropBrightness: {
                type: FileObjectTypes.INTEGER,
            },
            DropClientSide: {
                type: FileObjectTypes.BOOLEAN,
            },
        },
    },
    ...Generation,
};

addFileObjectAliases(ItemFileObjects, {
    Material: ['Id'],
    Model: ['CustomModelData'],
    Group: ['ItemType'],
});
