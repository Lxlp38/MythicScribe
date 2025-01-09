export enum ObjectType {
    MECHANIC = 'Mechanic',
    ATTRIBUTE = 'Attribute',
    TARGETER = 'Targeter',
    CONDITION = 'Condition',
    INLINECONDITION = 'Inline Condition',
    TRIGGER = 'Trigger',
    AITARGET = 'AITarget',
    AIGOAL = 'AIGoal',
}

export interface Attribute {
    name: string[];
    type: string;
    enum?: string;
    list?: boolean;
    description: string;
    link: string;
    default_value: string;
    inheritable?: boolean;
}

export interface Mechanic {
    plugin: string;
    class: string;
    extends?: string;
    implements?: string[];
    name: string[];
    description: string;
    link: string;
    attributes: Attribute[];
}

export type MechanicDataset = Mechanic[];

export interface ObjectInfo {
    dataset: MechanicDataset;
    datasetMap: Map<string, Mechanic>;
    datasetClassMap: Map<string, Mechanic>;
    regex: RegExp;
}

function newObjectInfo(regex: RegExp): ObjectInfo {
    return {
        dataset: [],
        datasetMap: new Map<string, Mechanic>(),
        datasetClassMap: new Map<string, Mechanic>(),
        regex: regex,
    };
}

/**
 * A mapping of `ObjectType` to its corresponding information including dataset, dataset maps, and regex patterns.
 *
 * @typeParam ObjectType - The type of the object.
 * @property {MechanicDataset} dataset - An array to hold the dataset of the object type.
 * @property {Map<string, Mechanic>} datasetMap - A map to hold the dataset with string keys and Mechanic values.
 * @property {Map<string, Mechanic>} datasetClassMap - A map to hold the dataset classes with string keys and Mechanic values.
 * @property {RegExp} regex - A regular expression to match specific patterns for the object type.
 */
export const ObjectInfo: { [key in ObjectType]: ObjectInfo } = {
    [ObjectType.MECHANIC]: newObjectInfo(/(?<=\s- )[\w:]+/gm),
    [ObjectType.ATTRIBUTE]: newObjectInfo(/(?<=[{;])\w+(?==)/gm),
    [ObjectType.TARGETER]: newObjectInfo(/(?<=[\s=]@)[\w:]+/gm),
    [ObjectType.CONDITION]: newObjectInfo(/(?<=[\s\|\&][-\(\|\&\)] )[\w:]+/gm),
    [ObjectType.INLINECONDITION]: newObjectInfo(/(?<=\s(\?)|(\?!)|(\?~)|(\?~!))[\w:]+/gm),
    [ObjectType.TRIGGER]: newObjectInfo(/(?<=\s~)on[\w:]+/gm),
    [ObjectType.AITARGET]: newObjectInfo(/(?<=\s- )[\w:]+/gm),
    [ObjectType.AIGOAL]: newObjectInfo(/(?<=\s- )[\w:]+/gm),
};

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
