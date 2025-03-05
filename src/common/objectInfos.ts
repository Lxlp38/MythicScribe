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

interface BaseFileObject {
    link?: string;
    description?: string;
    values?: string[];
}
interface EnumFileObject extends BaseFileObject {
    type: FileObjectTypes.ENUM;
    dataset: string;
}
interface ListFileObject extends BaseFileObject {
    type: FileObjectTypes.LIST;
    dataset?: string;
    keys?: FileObjectMap;
}
interface KeyFileObject extends BaseFileObject {
    type: FileObjectTypes.KEY;
    keys: FileObjectMap;
}
interface OtherFileObject extends BaseFileObject {
    type: Exclude<
        FileObjectTypes,
        FileObjectTypes.ENUM | FileObjectTypes.LIST | FileObjectTypes.KEY
    >;
}

export type FileObject = EnumFileObject | ListFileObject | KeyFileObject | OtherFileObject;

export interface FileObjectMap {
    [key: string]: FileObject;
}

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
