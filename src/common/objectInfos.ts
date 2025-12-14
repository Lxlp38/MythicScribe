import { EnumDatasetValue } from './datasets/types/Enum';

export enum SchemaElementTypes {
    BOOLEAN = 'boolean',
    STRING = 'string',
    INTEGER = 'integer',
    FLOAT = 'float',

    VECTOR = 'vector',
    RGB = 'rgb',

    LIST = 'list',

    KEY = 'key',
    KEY_LIST = 'key_list',

    ENTRY_LIST = 'entry_list',

    ENUM = 'enum',
}

export enum SchemaElementSpecialKeys {
    WILDKEY = '*KEY',
    ARRAYKEY = '*ARRAY',
}

type BaseSchemaElement = {
    link?: string;
    description?: string;
    values?: string[];
    display?: string;
    plugin?: string;
    possibleKeyValues?: () => Map<string, EnumDatasetValue>;
};

export type EntrySchemaElement = {
    entries?: Array<SchemaElement>;
};

export type EnumSchemaElement = BaseSchemaElement & {
    type: SchemaElementTypes.ENUM;
    dataset: string;
};
export type ListSchemaElement = BaseSchemaElement &
    EntrySchemaElement & {
        type: SchemaElementTypes.LIST;
        dataset?: string;
        keys?: Schema | (() => Schema);
    };
export type KeySchemaElement = BaseSchemaElement & {
    type: SchemaElementTypes.KEY;
    keys: Schema | (() => Schema);
    maxDepth?: boolean;
};
export type EntryListSchemaElement = BaseSchemaElement &
    EntrySchemaElement & {
        type: SchemaElementTypes.ENTRY_LIST;
        entries: Array<SchemaElement>;
    };
export type OtherSchemaElement = BaseSchemaElement & {
    type: Exclude<
        SchemaElementTypes,
        | SchemaElementTypes.ENUM
        | SchemaElementTypes.LIST
        | SchemaElementTypes.KEY
        | SchemaElementTypes.ENTRY_LIST
    >;
};

export type SchemaElement =
    | EnumSchemaElement
    | ListSchemaElement
    | KeySchemaElement
    | EntryListSchemaElement
    | OtherSchemaElement;

type DefaultSchemaElementMap = Record<string, SchemaElement>;
type SpecialSchemaElementBaseMap = { display: string };

export type WildKeySchemaElement = SpecialSchemaElementBaseMap & KeySchemaElement;
export type ArrayKeySchemaElement = SpecialSchemaElementBaseMap & {
    possibleKeyValues: () => Map<string, EnumDatasetValue>;
} & SchemaElement;

type SpecialKeys = {
    // When this key is present, it indicates that any key is allowed here.
    [SchemaElementSpecialKeys.WILDKEY]: WildKeySchemaElement;
    // When this key is present, it indicates that the possible keys are those found in the specified enum dataset.
    [SchemaElementSpecialKeys.ARRAYKEY]: ArrayKeySchemaElement;
};

export type Schema = DefaultSchemaElementMap & Partial<SpecialKeys>;

export const keyAliases = {
    Skills: [
        'Skills',
        'FurnitureSkills',
        'InitSkills',
        'QuitSkills',
        'LevelSkills',
        'CustomBlockSkills',
    ],
    Conditions: ['Conditions', 'TriggerConditions', 'TargetConditions'],
    DroptableConditions: ['Conditions', 'TriggerConditions'],
    AITargetSelectors: ['AITargetSelectors'],
    AIGoalSelectors: ['AIGoalSelectors'],
};

export enum TriggerType {
    MOB = 'Mob',
    ITEM = 'Item',
    ARCHETYPE = 'Archetype',
    BLOCK = 'Block',
    FURNITURE = 'Furniture',
}
export const registryKey = [
    'metaskill',
    'mob',
    'item',
    'droptable',
    'stat',
    'pin',
    'placeholder',
    'randomspawn',
    'equipmentset',
    'archetype',
    'reagent',
    'menu',
    'achievement',
] as const;
export type registryKey = (typeof registryKey)[number];

export const extendedRegistryKey = [...registryKey, 'furniture', 'block', 'spell'] as const;
export type extendedRegistryKey = (typeof extendedRegistryKey)[number];

export const specialAttributeEnumToRegistryKey: Record<string, registryKey> = {
    spell: 'metaskill',
    block: 'item',
    customblock: 'item',
    furniture: 'item',
};

export function isBoolean(value: string): boolean {
    return value === 'Boolean' || value === 'PlaceholderBoolean';
}

export enum DefaultPlugins {
    MythicMobs = 'MythicMobs',
    ModelEngine = 'ModelEngine',
    MythicCrucible = 'MythicCrucible',
    MythicRPG = 'MythicRPG',
    MythicAchievements = 'MythicAchievements',
}

export function getKeySchema(maybeSchema: Schema | (() => Schema)): Schema {
    if (typeof maybeSchema === 'function') {
        return maybeSchema();
    }
    return maybeSchema;
}
