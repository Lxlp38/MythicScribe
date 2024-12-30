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

interface EnumInfo {
    [key: string]: EnumDetail;
}

export interface EnumDetail {
    readonly path: string | null;
    readonly volatile?: boolean; //Whether the path to the enum depends on the selected minecraft version
    dataset: EnumDataset;
    commalist: string;
}

export interface EnumDataset {
    [key: string]: EnumDatasetValue;
}

export interface EnumDatasetValue {
    description?: string;
    name?: string[];
}

export function newEnumDetail(path: string | null = null, volatile: boolean = true): EnumDetail {
    return {
        path: path,
        volatile: volatile,
        dataset: {},
        commalist: '',
    };
}

export const EnumInfo: EnumInfo = {
    SOUND: newEnumDetail('minecraft/sounds.json'),

    AUDIENCE: newEnumDetail('mythic/audiences.json', false),
    EQUIPSLOT: newEnumDetail('mythic/equipslot.json', false),
    PARTICLE: newEnumDetail('mythic/particles.json', false),
    STATMODIFIER: newEnumDetail('mythic/statsmodifiers.json', false),
    SHAPE: newEnumDetail('mythic/shape.json', false),
    FLUID: newEnumDetail('mythic/fluid.json', false),
    GLOWCOLOR: newEnumDetail('mythic/glowcolor.json', false),
    SCOREACTION: newEnumDetail('mythic/scoreaction.json', false),
    VARIABLESCOPE: newEnumDetail('mythic/variablescope.json', false),
    MYTHICENTITY: newEnumDetail('mythic/mythicentity.json', false),
    PAPERATTRIBUTEOPERATION: newEnumDetail('mythic/attributesoperations.json', false),

    PAPERATTRIBUTE: newEnumDetail('paper/attributes.json'),
    BARCOLOR: newEnumDetail('paper/barcolor.json'),
    BARSTYLE: newEnumDetail('paper/barstyle.json'),
    DAMAGECAUSE: newEnumDetail('paper/damagecause.json'),
    DYE: newEnumDetail('paper/dye.json'),
    MATERIAL: newEnumDetail('paper/material.json'),
    BLOCKFACE: newEnumDetail('paper/blockface.json'),
    ENDERDRAGONPHASE: newEnumDetail('paper/enderdragonphase.json'),
    DRAGONBATTLERESPAWNPHASE: newEnumDetail('paper/dragonbattlerespawnphase.json'),
    POTIONEFFECTTYPE: newEnumDetail('paper/potioneffecttype.json'),
    WORLDENVIRONMENT: newEnumDetail('paper/worldenvironment.json'),
    ENTITYTYPE: newEnumDetail('paper/entitytype.json'),
    GAMEMODE: newEnumDetail('paper/gamemode.json'),
    SPAWNREASON: newEnumDetail('paper/spawnreason.json'),
    ENCHANTMENT: newEnumDetail('paper/enchantment.json'),
    ITEMFLAG: newEnumDetail('paper/itemflag.json'),
    SOUNDCATEGORY: newEnumDetail('paper/soundcategory.json'),
    FIREWORKEFFECTTYPE: newEnumDetail('paper/fireworkeffecttype.json'),
    FLUIDCOLLISIONMODE: newEnumDetail('paper/fluidcollisionmode.json'),

    ADDTRADE_ACTION: newEnumDetail('mythic/mechanicScoped/addtrade_action.json', false),
    DISPLAYTRANSFORMATION_ACTION: newEnumDetail(
        'mythic/mechanicScoped/displaytransformation_action.json',
        false,
    ),
    PROJECTILE_BULLETTYPE: newEnumDetail('mythic/mechanicScoped/projectile_bullettype.json', false),
    PROJECTILE_TYPE: newEnumDetail('mythic/mechanicScoped/projectile_type.json', false),
    PROJECTILE_HIGHACCURACYMODE: newEnumDetail(
        'mythic/mechanicScoped/projectile_highaccuracymode.json',
        false,
    ),
    MODIFYPROJECTILE_ACTION: newEnumDetail(
        'mythic/mechanicScoped/modifyprojectile_action.json',
        false,
    ),
    MODIFYPROJECTILE_TRAIT: newEnumDetail(
        'mythic/mechanicScoped/modifyprojectile_trait.json',
        false,
    ),
    SETMAXHEALTH_MODE: newEnumDetail('mythic/mechanicScoped/setmaxhealth_mode.json', false),
    SHOOT_TYPE: newEnumDetail('mythic/mechanicScoped/shoot_type.json', false),
    SHOOTFIREBALL_TYPE: newEnumDetail('mythic/mechanicScoped/shootfireball_type.json', false),
    THREAT_MODE: newEnumDetail('mythic/mechanicScoped/threat_mode.json', false),
    TIME_MODE: newEnumDetail('mythic/mechanicScoped/time_mode.json', false),
    VELOCITY_MODE: newEnumDetail('mythic/mechanicScoped/velocity_mode.json', false),
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
    dataset?: keyof typeof EnumInfo;
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
};

export enum TriggerType {
    MOB = 'Mob',
    ITEM = 'Item',
    ARCHETYPE = 'Archetype',
    BLOCK = 'Block',
    FURNITURE = 'Furniture',
}
