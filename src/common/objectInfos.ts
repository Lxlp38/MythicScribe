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

    ENUM = 'enum',
}

export enum SchemaElementSpecialKeys {
    WILDKEY = '*KEY',
}

type BaseSchemaElement = {
    link?: string;
    description?: string;
    values?: string[];
    display?: string;
    plugin?: string;
};
type EnumSchemaElement = BaseSchemaElement & {
    type: SchemaElementTypes.ENUM;
    dataset: string;
};
type ListSchemaElement = BaseSchemaElement & {
    type: SchemaElementTypes.LIST;
    dataset?: string;
    keys?: Schema | (() => Schema);
};
export type KeySchemaElement = BaseSchemaElement & {
    type: SchemaElementTypes.KEY;
    keys: Schema | (() => Schema);
    maxDepth?: boolean;
};
type OtherSchemaElement = BaseSchemaElement & {
    type: Exclude<
        SchemaElementTypes,
        SchemaElementTypes.ENUM | SchemaElementTypes.LIST | SchemaElementTypes.KEY
    >;
};

export type SchemaElement =
    | EnumSchemaElement
    | ListSchemaElement
    | KeySchemaElement
    | OtherSchemaElement;

type DefaultSchemaElementMap = Record<string, SchemaElement>;
type SpecialSchemaElementBaseMap = { display: string };

export type WildKeySchemaElement = SpecialSchemaElementBaseMap & KeySchemaElement;

type SpecialKeys = {
    [SchemaElementSpecialKeys.WILDKEY]?: WildKeySchemaElement;
};

export type Schema = DefaultSchemaElementMap & SpecialKeys;

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
