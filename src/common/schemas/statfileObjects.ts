import { generateNumbersInRange } from '../utils/schemautils';
import { FileObjectMap, FileObjectTypes } from '../objectInfos';

export const StatFileObjects: FileObjectMap = {
    Enabled: {
        type: FileObjectTypes.BOOLEAN,
        description: 'If the stat is currently enabled.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    AlwaysActive: {
        type: FileObjectTypes.BOOLEAN,
        description: 'If the stat is forcefully applied to every registry of every entity.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    Type: {
        type: FileObjectTypes.ENUM,
        dataset: 'STATTYPE',
        description: 'The type of the stat.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-types',
    },
    Display: {
        type: FileObjectTypes.STRING,
        description: 'The name with which the stat is displayed.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    Tooltips: {
        type: FileObjectTypes.KEY,
        description: 'How the stat is shown on items. Depends on the Modifier used.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#tooltips-formatting',
        keys: {
            Additive: {
                type: FileObjectTypes.STRING,
                description: 'The tooltip to show for additive modifiers.',
            },
            Multiply: {
                type: FileObjectTypes.STRING,
                description: 'The tooltip to show for multiply modifiers.',
            },
            Compound: {
                type: FileObjectTypes.STRING,
                description: 'The tooltip to show for compound modifiers.',
            },
            Setter: {
                type: FileObjectTypes.STRING,
                description: 'The tooltip to show for setter modifiers.',
            },
            Rounding: {
                type: FileObjectTypes.INTEGER,
                description: 'The amount of numbers after the point in the value of the stat.',
                values: generateNumbersInRange(0, 4, 1, false),
            },
            ShowInItemLore: {
                type: FileObjectTypes.BOOLEAN,
                description:
                    "Whether the tooltips should be shown in an item's lore. Defaults to true, overridden by the ShowInLore options if they are set.",
            },
        },
    },
    ShowInLore: {
        type: FileObjectTypes.KEY,
        description: "Whether to show the modifier tooltips in an item's lore.",
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#tooltips-formatting',
        keys: {
            Additive: {
                type: FileObjectTypes.BOOLEAN,
                description: "Whether to show the Additive modifier tooltip in an item's lore.",
            },
            Multiply: {
                type: FileObjectTypes.BOOLEAN,
                description: "Whether to show the Multiply modifier tooltip in an item's lore.",
            },
            Compound: {
                type: FileObjectTypes.BOOLEAN,
                description: "Whether to show the Compound modifier tooltip in an item's lore.",
            },
            Setter: {
                type: FileObjectTypes.BOOLEAN,
                description: "Whether to show the Setter modifier tooltip in an item's lore.",
            },
        },
    },
    Priority: {
        type: FileObjectTypes.INTEGER,
        description:
            'The priority with which the stat will take effect, compared to others. Lower values make it so the stat will trigger before stats with higher values.',
        values: generateNumbersInRange(0, 10, 1, false),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    MinValue: {
        type: FileObjectTypes.FLOAT,
        description: 'Minimum value for the stat.',
        values: generateNumbersInRange(0, 10, 0.5, true),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    MaxValue: {
        type: FileObjectTypes.FLOAT,
        description: 'Maximum value for the stat.',
        values: generateNumbersInRange(0, 10, 0.5, true),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    Triggers: {
        type: FileObjectTypes.LIST,
        description: 'The triggers for the stat.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    ParentStats: {
        type: FileObjectTypes.LIST,
        dataset: 'STAT',
        description: 'The parent stats for the stat.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    TriggerStats: {
        type: FileObjectTypes.LIST,
        dataset: 'STAT',
        description:
            "A list of stats that the triggering entity may have and their FormulaKey, separated by a space. The FormulaKey can then be used in other Formulas to fetch its value from the trigger's",
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    Formula: {
        type: FileObjectTypes.STRING,
        description: 'A formula for the base value if this stat has parent stats.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    FormulaKey: {
        type: FileObjectTypes.STRING,
        description: 'A key you can use in formulas, when this stat is the parent of another.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    BaseValue: {
        type: FileObjectTypes.FLOAT,
        description: "A static base value if it doesn't have parents.",
        values: generateNumbersInRange(0, 100, 0.5, true),
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    ExecutionPoint: {
        type: FileObjectTypes.ENUM,
        dataset: 'STATEXECUTIONPOINT',
        description:
            'For stats that modify a trigger, can be PRE or POST. Determines whether the stat is evaluated before or after any mechanics.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
    Skills: {
        type: FileObjectTypes.LIST,
        description: 'The skills that get executed when the stat is activated.',
        link: 'https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Stats#custom-stat-options',
    },
};
