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

export interface FileObjectMap {
    [key: string]: FileObject;
}

export interface FileObject {
    type: FileObjectTypes;
    link?: string;
    description?: string;
    keys?: FileObjectMap;
    dataset?: string;
    values?: string[];
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
