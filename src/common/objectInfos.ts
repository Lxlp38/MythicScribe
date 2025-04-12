export enum FileObjectTypes {
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

export enum FileObjectSpecialKeys {
    WILDKEY = '*KEY',
}

type BaseFileObject = {
    link?: string;
    description?: string;
    values?: string[];
    display?: string;
};
type EnumFileObject = BaseFileObject & {
    type: FileObjectTypes.ENUM;
    dataset: string;
};
type ListFileObject = BaseFileObject & {
    type: FileObjectTypes.LIST;
    dataset?: string;
    keys?: FileObjectMap;
};
export type KeyFileObject = BaseFileObject & {
    type: FileObjectTypes.KEY;
    keys: FileObjectMap;
};
type OtherFileObject = BaseFileObject & {
    type: Exclude<
        FileObjectTypes,
        FileObjectTypes.ENUM | FileObjectTypes.LIST | FileObjectTypes.KEY
    >;
};

export type FileObject = EnumFileObject | ListFileObject | KeyFileObject | OtherFileObject;

type DefaultFileObjectMap = Record<string, FileObject>;
type SpecialFileObjectbaseMap = { display: string };

export type WildKeyFileObject = SpecialFileObjectbaseMap & KeyFileObject;

type SpecialKeys = {
    [FileObjectSpecialKeys.WILDKEY]?: WildKeyFileObject;
};

export type FileObjectMap = DefaultFileObjectMap & SpecialKeys;

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
    'placeholder',
] as const;
export type registryKey = (typeof registryKey)[number];
