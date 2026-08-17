import { inheritSchemaOptions } from '../utils/schemautils';
import {
    DefaultPlugins,
    Schema,
    SchemaElementSpecialKeys,
    SchemaElementTypes,
} from '../objectInfos';
import { Generation } from './itemSchema';

const IconSchema: Schema = {
    Material: {
        type: SchemaElementTypes.ENUM,
        dataset: 'MATERIAL',
        description: 'The material used for the archetype icon.',
    },
    Model: {
        type: SchemaElementTypes.STRING,
        description: 'The model identifier used for the archetype icon.',
    },
    ...Generation,
};

const TalentComponentSchema: Schema = {
    Type: {
        type: SchemaElementTypes.STRING,
        values: ['SPELL', 'STATS', 'SPELLSTATS'],
        description: 'The type of talent component.',
    },
    Spell: {
        type: SchemaElementTypes.STRING,
        description: 'The spell granted or modified by a SPELL or SPELLSTATS component.',
    },
    Skill: {
        type: SchemaElementTypes.STRING,
        description: 'Alias of Spell, accepted by a SPELLSTATS component.',
    },
    Spells: {
        type: SchemaElementTypes.LIST,
        description: 'Multiple spells modified by a SPELLSTATS component.',
    },
    Skills: {
        type: SchemaElementTypes.LIST,
        description: 'Alias of Spells, accepted by a SPELLSTATS component.',
    },
    Stats: {
        type: SchemaElementTypes.LIST,
        dataset: 'STAT',
        description: 'Legacy stat modifier lines used by a STATS component.',
    },
};

/**
 * A talent modifier node. Modifiers may also be written as a list of inline
 * lines, in which case they are parsed as formulaic modifiers instead.
 */
const TalentModifierSchema: Schema = {
    Base: {
        type: SchemaElementTypes.STRING,
        description: 'The modifier value at the first invested rank.',
    },
    PerLevel: {
        type: SchemaElementTypes.STRING,
        description: 'The additional modifier value applied per rank above the first.',
    },
    Min: {
        type: SchemaElementTypes.STRING,
        description: 'The lower bound of the resulting modifier value.',
    },
    Max: {
        type: SchemaElementTypes.STRING,
        description: 'The upper bound of the resulting modifier value.',
    },
};

/**
 * The talent button/tooltip template of a talent tree. `Tooltip` is normalized
 * into `Lore` when `Lore` is not set.
 */
const TalentButtonSchema: Schema = {
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'The display name of the talent button.',
    },
    Lore: {
        type: SchemaElementTypes.LIST,
        description: 'The lore lines of the talent button.',
    },
    Tooltip: {
        type: SchemaElementTypes.LIST,
        description: 'Lore lines used when Lore is not set.',
    },
};

const TalentSchema: Schema = {
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'The display name of the talent.',
    },
    DisplayOrder: {
        type: SchemaElementTypes.INTEGER,
        description: 'The ordering of the talent in menus.',
    },
    Description: {
        type: SchemaElementTypes.LIST,
        description: 'The talent description shown in menus.',
    },
    RequiredPoints: {
        type: SchemaElementTypes.INTEGER,
        description: 'Points that must already be invested in the tree.',
    },
    MaxPoints: {
        type: SchemaElementTypes.INTEGER,
        description: 'Maximum points that may be invested in the talent.',
    },
    Cost: {
        type: SchemaElementTypes.STRING,
        description: 'The point cost for each rank of the talent. Placeholders are supported.',
    },
    Parents: {
        type: SchemaElementTypes.LIST,
        description: 'Parent talent IDs, optionally followed by required points.',
    },
    Parent: {
        type: SchemaElementTypes.STRING,
        description: 'Legacy single-parent talent ID, optionally followed by required points.',
    },
    ExclusiveWith: {
        type: SchemaElementTypes.LIST,
        description: 'Talent IDs that cannot be invested in together with this talent.',
    },
    Icon: {
        type: SchemaElementTypes.KEY,
        description: 'The icon displayed for the talent.',
        keys: IconSchema,
    },
    Components: {
        type: SchemaElementTypes.LIST,
        entries: Object.values(TalentComponentSchema),
        description: 'The effects applied by the talent.',
    },
    Modifiers: {
        type: SchemaElementTypes.KEY,
        description:
            'Named modifiers scaled by invested ranks. May also be written as a list of inline formulaic modifier lines.',
        keys: {
            [SchemaElementSpecialKeys.WILDKEY]: {
                display: 'Talent modifier',
                type: SchemaElementTypes.KEY,
                description: 'A named talent modifier.',
                keys: TalentModifierSchema,
            },
        },
    },
};

export const TalentTreeSchema: Schema = {
    Display: {
        type: SchemaElementTypes.STRING,
        description: 'The display name of the talent tree.',
    },
    Description: {
        type: SchemaElementTypes.LIST,
        description: 'The talent tree description shown in menus.',
    },
    Icon: {
        type: SchemaElementTypes.KEY,
        description: 'The default icon for the talent tree.',
        keys: IconSchema,
    },
    PointType: {
        type: SchemaElementTypes.STRING,
        description: 'The point type spent in this talent tree.',
    },
    AssociatedArchetypes: {
        type: SchemaElementTypes.LIST,
        dataset: 'Archetype',
        description: 'Archetypes that activate this standalone talent tree.',
    },
    TalentsForgettable: {
        type: SchemaElementTypes.BOOLEAN,
        description: 'Whether invested talents can be divested individually.',
    },
    Menu: {
        type: SchemaElementTypes.STRING,
        description: 'The MythicMobs menu opened for this talent tree.',
    },
    DefaultInvestmentButton: {
        type: SchemaElementTypes.KEY,
        description: 'The default button template used for talents in this tree.',
        keys: TalentButtonSchema,
    },
    InvestmentButton: {
        type: SchemaElementTypes.KEY,
        description: 'Alias of DefaultInvestmentButton.',
        keys: TalentButtonSchema,
    },
    TalentButton: {
        type: SchemaElementTypes.KEY,
        description: 'Alias of DefaultInvestmentButton.',
        keys: TalentButtonSchema,
    },
    IconTemplate: {
        type: SchemaElementTypes.KEY,
        description: 'Alias of DefaultInvestmentButton.',
        keys: TalentButtonSchema,
    },
    Tooltip: {
        type: SchemaElementTypes.LIST,
        description:
            'Shorthand talent tooltip lore, used when no button template section is present.',
    },
    Talents: {
        type: SchemaElementTypes.KEY,
        description: 'Named talents in this tree.',
        keys: {
            [SchemaElementSpecialKeys.WILDKEY]: {
                display: 'Talent',
                type: SchemaElementTypes.KEY,
                description: 'A named talent definition.',
                keys: TalentSchema,
            },
        },
    },
};

export const ArchetypeSchema: Schema = {
    Category: {
        type: SchemaElementTypes.STRING,
        description: 'The category of the archetype.',
    },
    Group: {
        type: SchemaElementTypes.STRING,
        description: "The type of archetype this falls under, such as 'CLASS'",
    },
    Display: {
        type: SchemaElementTypes.STRING,
        description: "The proper display name of this archetype, such as 'Wizard'",
    },
    DisplayOrder: {
        type: SchemaElementTypes.INTEGER,
        description: 'The ordering of the archetype in menus.',
    },
    Description: {
        type: SchemaElementTypes.LIST,
        description: 'The description of the archetype',
    },
    Permission: {
        type: SchemaElementTypes.STRING,
        description: 'Permission required to use or select the archetype.',
    },
    Icon: {
        type: SchemaElementTypes.KEY,
        description: 'The icon representing the archetype.',
        keys: IconSchema,
    },
    BaseStats: {
        type: SchemaElementTypes.LIST,
        dataset: 'STAT',
        description: 'A list of base stats for this archetype',
    },
    StatModifiers: {
        type: SchemaElementTypes.LIST,
        dataset: 'STAT',
        description:
            "Unlike base stats, these will apply on top of a player's stats and can stack with other archetypes",
    },
    SpellUnlocks: {
        type: SchemaElementTypes.LIST,
        description: 'A list of spells unlocked by this archetype',
    },
    TalentTree: {
        type: SchemaElementTypes.KEY,
        description: 'The optional talent tree attached to this archetype.',
        keys: TalentTreeSchema,
    },
    InitSkills: {
        type: SchemaElementTypes.LIST,
        description: 'A list of skills called when a player gains this class',
    },
    QuitSkills: {
        type: SchemaElementTypes.LIST,
        description: 'A list of skills called when a player loses this class',
    },
    LevelSkills: {
        type: SchemaElementTypes.LIST,
        description: 'A list of skills called when a player levels up this class',
    },
    Skills: {
        type: SchemaElementTypes.LIST,
        description:
            'A list of mechanics applied to anyone with this archetype. Functions the same as how Mythic Mobs are configured',
    },
    Leveling: {
        type: SchemaElementTypes.KEY,
        description: 'A list of options regarding how the class levels up',
        link: 'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Archetypes/Leveling',
        keys: {
            MinLevel: {
                type: SchemaElementTypes.INTEGER,
                description: 'The level the player starts at with this archetype',
            },
            MaxLevel: {
                type: SchemaElementTypes.INTEGER,
                description: 'The maximum level of this archetype',
            },
            ExperienceCurve: {
                type: SchemaElementTypes.STRING,
                description: 'The experience curve this archetype uses',
            },
            ExperienceSource: {
                type: SchemaElementTypes.STRING,
                description: 'The experience source group this archetype can benefit from',
            },
        },
    },
    Bindings: {
        type: SchemaElementTypes.LIST,
        description: "Force a player's bindings as they level up",
    },
    ClickCombos: {
        type: SchemaElementTypes.LIST,
        description: 'Override click-combo bindings for this archetype.',
    },
};

inheritSchemaOptions(
    ArchetypeSchema,
    'https://git.lumine.io/mythiccraft/mythicrpg/-/wikis/Archetypes#configuration',
    DefaultPlugins.MythicRPG
);
