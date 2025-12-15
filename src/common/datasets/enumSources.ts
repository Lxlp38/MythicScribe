import { atlasDataNode, AtlasFileNodeImpl } from './AtlasNode';

export const localEnums: AtlasFileNodeImpl[] = atlasDataNode.getNode('mythic')?.getFiles() || [];

export enum scriptedEnums {
    Color = 'color',
    RGBColor = 'rgbcolor',
    Boolean = 'boolean',

    // List of all mechanic types
    MechanicList = 'mechaniclist',
    TargeterList = 'targeterlist',
    TriggerList = 'triggerlist',
    ConditionList = 'conditionlist',

    // Node-related datasets
    Mob = 'mob',
    Metaskill = 'metaskill',
    Droptable = 'droptable',
    Stat = 'stat',
    Pin = 'pin',
    CustomPlaceholder = 'customplaceholder',
    RandomSpawn = 'randomspawn',
    EquipmentSet = 'equipmentset',
    MythicItem = 'mythicitem',
    Archetype = 'archetype',
    Reagent = 'reagent',
    Menu = 'menu',
    Achievement = 'achievement',

    // Specialized datasets
    Item = 'item',
    Targeter = 'targeter',
    Trigger = 'trigger',
    ReagentValue = 'reagentvalue',
    Spell = 'spell',
    Furniture = 'furniture',
    CustomBlock = 'customblock',
    Block = 'block',

    // First "level" of the schemas, without nested keys
    MobSchema = 'mobschema',
    ItemSchema = 'itemschema',
    MetaskillSchema = 'metaskillschema',
    DroptableSchema = 'droptableschema',
    StatSchema = 'statschema',
    RandomSpawnSchema = 'randomspawnschema',
    PlaceholderSchema = 'placeholderschema',
    EquipmentSetSchema = 'equipmentsetschema',
    ReagentSchema = 'reagentschema',
    MenuSchema = 'menuschema',
    AchievementSchema = 'achievementschema',
}

export enum attributeSpecialValues {
    conditions = 'conditions',
}
