import {
    DefaultPlugins,
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
} from '../objectInfos';
import { inheritSchemaOptions } from '../utils/schemautils';

const supportedSlots = [
    'MAINHAND',
    'OFFHAND',
    'HAND',
    'HEAD',
    'CHEST',
    'LEGS',
    'FEET',
    'ALL',
    'ANY',
    'MAIN',
    'OFF',
    'SHIELD',
    'HELMET',
    'CHESTPLATE',
    'LEGGINGS',
    'BOOTS',
];

const AttributeSlotSchema: Schema = {
    [SchemaElementSpecialKeys.WILDKEY]: {
        display: 'Equipment slot',
        type: SchemaElementTypes.KEY,
        description: "Equipment-slot attribute entries such as 'attack_damage 2.0 ADD_NUMBER'.",
        keys: {},
    },
};

const LegacyCostSchema: Schema = {
    Base: {
        type: SchemaElementTypes.INTEGER,
        description: 'Base cost at level one.',
    },
    PerLevel: {
        type: SchemaElementTypes.INTEGER,
        description: 'Additional cost per level above the first.',
    },
    per_level_above_first: {
        type: SchemaElementTypes.INTEGER,
        description: 'Legacy lower-case alias for PerLevel.',
    },
    AdditionalPerLevelCost: {
        type: SchemaElementTypes.INTEGER,
        description: 'Legacy alias for PerLevel.',
    },
};

const EnchantDataValueSchema: Schema = {
    [SchemaElementSpecialKeys.WILDKEY]: {
        display: 'EnchantData component',
        type: SchemaElementTypes.KEY,
        description:
            'A Minecraft enchantment effect component or nested value. Unknown components are allowed for forward compatibility.',
        keys: () => EnchantDataValueSchema,
    },
};

const EnchantOptionsSchema: Schema = {
    Enabled: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether the enchantment effects and skills are enabled.',
    },
    Cursed: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether the enchantment is treated as a curse.',
    },
    Treasure: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether the enchantment is treasure-only.',
    },
    RandomLoot: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether the enchantment may appear in random loot.',
    },
    Tradeable: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether villagers may trade the enchantment.',
    },
    TradedEquipment: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether the enchantment may appear on traded equipment.',
    },
    MobSpawnEquipment: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether mobs may spawn with the enchantment.',
    },
    PVP: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether the enchantment affects player-versus-player combat.',
    },
    StrictMythicItems: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether addon-specific PrimaryItems are enforced at runtime.',
    },
    OfferedInEnchantingTable: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy alias migrated to Enchanting.Promised.',
    },
    TooltipOrder: {
        type: SchemaElementTypes.INTEGER,
        description: 'The ordering value used in the item tooltip.',
    },
};

const EnchantingSchema: Schema = {
    PrimaryItems: {
        type: SchemaElementTypes.LIST,
        description:
            'Items shown as primary candidates. Supports item tags/materials and addon IDs such as mythic:, nexo:, itemsadder:, and craftengine:.',
    },
    BookOffer: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether the enchantment may be offered on books.',
    },
    Weight: {
        type: SchemaElementTypes.INTEGER,
        description: 'The relative enchanting-table offer weight.',
    },
    MinCost: {
        type: SchemaElementTypes.KEY,
        description: 'The minimum enchanting-table cost.',
        keys: {
            Base: {
                type: SchemaElementTypes.INTEGER,
                description: 'Base cost at level one.',
            },
            PerLevel: {
                type: SchemaElementTypes.INTEGER,
                description: 'Additional cost per level.',
            },
            per_level_above_first: {
                type: SchemaElementTypes.INTEGER,
                description: 'Legacy lower-case alias for PerLevel.',
            },
        },
    },
    MaxCost: {
        type: SchemaElementTypes.KEY,
        description: 'The maximum enchanting-table cost; a scalar is also accepted as shorthand.',
        keys: LegacyCostSchema,
    },
    Promised: {
        type: SchemaElementTypes.BOOLEAN,
        description:
            'Whether the enchantment may be shown as a named promise in the table tooltip.',
    },
    Reagent: {
        type: SchemaElementTypes.LIST,
        description: 'Accepted reagent IDs. Omit for vanilla lapis, or use ALL for any reagent.',
    },
    Conditions: {
        type: SchemaElementTypes.LIST,
        description: 'MythicMobs conditions evaluated when the enchanting table is opened.',
    },
    ItemConditions: {
        type: SchemaElementTypes.LIST,
        description: 'MythicMobs or Crucible conditions evaluated against the item in the table.',
    },
};

export const EnchantmentSchema: Schema = {
    Override: {
        type: SchemaElementTypes.BOOLEAN,
        description:
            'Whether a vanilla enchantment definition should override the live vanilla enchantment.',
    },
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'The display name of the enchantment.',
    },
    Description: {
        type: SchemaElementTypes.STRING,
        description: 'The description shown for the enchantment.',
    },
    Rarity: {
        type: SchemaElementTypes.STRING,
        description: 'The rarity identifier, including custom rarity groups.',
    },
    MinLevel: {
        type: SchemaElementTypes.INTEGER,
        description: 'The minimum obtainable enchantment level.',
    },
    MaxLevel: {
        type: SchemaElementTypes.INTEGER,
        description: 'The maximum obtainable enchantment level.',
    },
    ValidSlots: {
        type: SchemaElementTypes.LIST,
        values: supportedSlots,
        description: 'Equipment slots that may carry the enchantment.',
    },
    SupportedItems: {
        type: SchemaElementTypes.STRING,
        description: 'A material, item tag, or Mythic item restriction.',
    },
    PrimaryItems: {
        type: SchemaElementTypes.LIST,
        description:
            'Primary item filters. Supports item tags/materials and addon IDs such as mythic:, nexo:, itemsadder:, and craftengine:.',
    },
    AnvilCost: {
        type: SchemaElementTypes.INTEGER,
        description: 'The anvil cost of the enchantment.',
    },
    ConflictingEnchants: {
        type: SchemaElementTypes.LIST,
        description: 'Enchantment IDs that cannot coexist with this enchantment.',
    },
    Tags: {
        type: SchemaElementTypes.LIST,
        description: 'Minecraft or MythicEnchants tags assigned to the enchantment.',
    },
    Options: {
        type: SchemaElementTypes.KEY,
        description: 'Behaviour and availability flags for this enchantment.',
        keys: EnchantOptionsSchema,
    },
    Enchanting: {
        type: SchemaElementTypes.KEY,
        description: 'Custom enchanting-table offer settings.',
        keys: EnchantingSchema,
    },
    Skills: {
        type: SchemaElementTypes.LIST,
        description: 'MythicMobs skill lines grouped by MythicEnchants trigger.',
    },
    Attributes: {
        type: SchemaElementTypes.KEY,
        description: 'Item attribute modifiers keyed by equipment slot.',
        keys: AttributeSlotSchema,
    },
    MythicAttributes: {
        type: SchemaElementTypes.LIST,
        description:
            'MythicMobs player-stat modifiers. MythicStats and Stats are accepted aliases.',
    },
    MythicStats: {
        type: SchemaElementTypes.LIST,
        description: 'Alias for MythicAttributes.',
    },
    Stats: {
        type: SchemaElementTypes.LIST,
        description: 'Legacy alias for MythicAttributes.',
    },
    Enabled: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Options.Enabled.',
    },
    Cursed: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Options.Cursed.',
    },
    Curse: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Options.Cursed.',
    },
    Treasure: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Options.Treasure.',
    },
    RandomLoot: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Options.RandomLoot.',
    },
    Tradeable: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Options.Tradeable.',
    },
    TradedEquipment: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Options.TradedEquipment.',
    },
    MobSpawnEquipment: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Options.MobSpawnEquipment.',
    },
    PVP: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Options.PVP.',
    },
    StrictMythicItems: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether addon-specific PrimaryItems are enforced at runtime.',
    },
    Weight: {
        type: SchemaElementTypes.INTEGER,
        description: 'Legacy top-level alias for Enchanting.Weight.',
    },
    MinCost: {
        type: SchemaElementTypes.KEY,
        description: 'Legacy top-level alias for Enchanting.MinCost; a scalar is also accepted.',
        keys: LegacyCostSchema,
    },
    MaxCost: {
        type: SchemaElementTypes.KEY,
        description: 'Legacy top-level alias for Enchanting.MaxCost; a scalar is also accepted.',
        keys: LegacyCostSchema,
    },
    Promised: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Enchanting.Promised.',
    },
    Reagent: {
        type: SchemaElementTypes.LIST,
        description: 'Legacy top-level alias for Enchanting.Reagent.',
    },
    Conditions: {
        type: SchemaElementTypes.LIST,
        description: 'Legacy top-level alias for Enchanting.Conditions.',
    },
    ItemConditions: {
        type: SchemaElementTypes.LIST,
        description: 'Legacy top-level alias for Enchanting.ItemConditions.',
    },
    BookOffer: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Legacy top-level alias for Enchanting.BookOffer.',
    },
    ItemType: {
        type: SchemaElementTypes.STRING,
        description: 'Legacy item-type shorthand used by older MythicEnchants definitions.',
    },
    EnchantData: {
        type: SchemaElementTypes.KEY,
        description:
            'Minecraft datapack effect components. Nested component keys are intentionally open-ended for version compatibility.',
        keys: EnchantDataValueSchema,
    },
};

inheritSchemaOptions(
    EnchantmentSchema,
    'https://git.lumine.io/mythiccraft/mythicenchants/-/wikis/Enchants/Enchantment-Config',
    DefaultPlugins.MythicEnchants
);
