export enum ObjectType {
	MECHANIC = 'Mechanic',
	ATTRIBUTE = 'Attribute',
	TARGETER = 'Targeter',
	CONDITION = 'Condition',
	INLINECONDITION = 'Inline Condition',
	TRIGGER = 'Trigger',
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
	[ObjectType.MECHANIC]: {
		dataset: [],
		datasetMap: new Map<string, Mechanic>(),
		datasetClassMap: new Map<string, Mechanic>(),
		regex: /(?<=\s- )[\w:]+(?=[\s{])/gm,
	},
	[ObjectType.ATTRIBUTE]: {
		dataset: [],
		datasetMap: new Map<string, Mechanic>(),
		datasetClassMap: new Map<string, Mechanic>(),
		regex: /(?<=[{;])\w+(?==)/gm,
	},
	[ObjectType.TARGETER]: {
		dataset: [],
		datasetMap: new Map<string, Mechanic>(),
		datasetClassMap: new Map<string, Mechanic>(),
		regex: /(?<=\s@)[\w:]+/gm,
	},
	[ObjectType.CONDITION]: {
		dataset: [],
		datasetMap: new Map<string, Mechanic>(),
		datasetClassMap: new Map<string, Mechanic>(),
		regex: /(?<=[\s\|\&][-\(\|\&\)] )[\w:]+/gm,
	},
	[ObjectType.INLINECONDITION]: {
		dataset: [],
		datasetMap: new Map<string, Mechanic>(),
		datasetClassMap: new Map<string, Mechanic>(),
		regex: /(?<=\s(\?)|(\?!)|(\?~)|(\?~!))[\w:]+/gm,
	},
	[ObjectType.TRIGGER]: {
		dataset: [],
		datasetMap: new Map<string, Mechanic>(),
		datasetClassMap: new Map<string, Mechanic>(),
		regex: /(?<=\s~)on[\w:]+/gm,
	}
};

export enum EnumType {
	// Enums

	SOUND = 'Sound',

	AUDIENCE = 'Audience',
	EQUIPSLOT = 'Equip Slot',
	PARTICLE = 'Particle',
	STATMODIFIER = 'Stat Modifier',
	SHAPE = 'Shape',
	FLUID = 'Fluid',
	GLOWCOLOR = 'Glow Color',
	SCOREACTION = 'Score Action',

	PAPERATTRIBUTE = 'Paper Attribute',
	PAPERATTRIBUTEOPERATION = 'Paper Attribute Operation',
	BARCOLOR = 'Bar Color',
	BARSTYLE = 'Bar Style',
	DAMAGECAUSE = 'Damage Cause',
	DYE = 'Dye',
	MATERIAL = 'Material',
	BLOCKFACE = 'Block Face',
	ENDERDRAGONPHASE = 'Ender Dragon Phase',
	DRAGONBATTLERESPAWNPHASE = 'Dragon Battle Respawn Phase',
	POTIONEFFECTTYPE = 'Potion Effect Type',
	WORLDENVIRONMENT = 'World Environment',
	ENTITYTYPE = 'Entity Type',
	GAMEMODE = 'Game Mode',
	SPAWNREASON = 'Spawn Reason',
	ENCHANTMENT = 'Enchantment',
	ITEMFLAG = 'Item Flag',
	SOUNDCATEGORY = 'Sound Category',
	FIREWORKEFFECTTYPE = 'Firework Effect Type',
	FLUIDCOLLISIONMODE = 'Fluid Collision Mode',

	ADDTRADE_ACTION = 'Add Trade Action',
	DISPLAYTRANSFORMATION_ACTION = 'Display Transformation Action',
	DISPLAYTRANSFORMATION_TYPE = 'Display Transformation Type',
	PROJECTILE_BULLETTYPE = 'Projectile Bullet Type',
	PROJECTILE_TYPE = 'Projectile Type',
	PROJECTILE_HIGHACCURACYMODE = 'Projectile High Accuracy Mode',
	MODIFYPROJECTILE_ACTION = 'Modify Projectile Action',
	MODIFYPROJECTILE_TRAIT = 'Modify Projectile Trait',
	PUSHBLOCK_DIRECTION = 'Push Block Direction',
	SENDTOAST_FRAME = 'Send Toast Frame',
	SETLEVEL_ACTION = 'Set Level Action',
	SETMAXHEALTH_MODE = 'Set Max Health Mode',
	SHOOT_TYPE = 'Shoot Type',
	SHOOTFIREBALL_TYPE = 'Shoot Fireball Type',
	THREAT_MODE = 'Threat Mode',
	TIME_MODE = 'Time Mode',
	VELOCITY_MODE = 'Velocity Action',
	VOLLEY_SOURCE = 'Volley Source',
	WEATHER_TYPE = 'Weather Type',
}

interface EnumInfo {
	[key: string]: EnumDetail ;
}

export interface EnumDetail  {
	readonly path: string;
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

function newEnumDetail(path: string, volatile: boolean = true) : EnumDetail {
	return {
		path: path,
		volatile: volatile,
		dataset: {},
		commalist: ""
	};
}

export const EnumInfo = {

	[EnumType.SOUND]: newEnumDetail("minecraft/sounds.json"),

	[EnumType.AUDIENCE]: newEnumDetail("mythic/audiences.json", false),

	[EnumType.EQUIPSLOT]: newEnumDetail("mythic/equipslot.json", false),

	[EnumType.PARTICLE]: newEnumDetail("mythic/particles.json", false),

	[EnumType.STATMODIFIER]: newEnumDetail("mythic/statsmodifiers.json", false),

	[EnumType.SHAPE]: newEnumDetail("mythic/shape.json", false),

	[EnumType.FLUID]: newEnumDetail("mythic/fluid.json", false),

	[EnumType.GLOWCOLOR]: newEnumDetail("mythic/glowcolor.json", false),

	[EnumType.SCOREACTION]: newEnumDetail("mythic/scoreaction.json", false),

	[EnumType.PAPERATTRIBUTE]: newEnumDetail("paper/attributes.json"),

	[EnumType.PAPERATTRIBUTEOPERATION]: newEnumDetail("mythic/attributesoperations.json", false),

	[EnumType.BARCOLOR]: newEnumDetail("paper/barcolor.json"),

	[EnumType.BARSTYLE]: newEnumDetail("paper/barstyle.json"),

	[EnumType.DAMAGECAUSE]: newEnumDetail("paper/damagecause.json"),

	[EnumType.DYE]: newEnumDetail("paper/dye.json"),

	[EnumType.MATERIAL]: newEnumDetail("paper/material.json"),

	[EnumType.BLOCKFACE]: newEnumDetail("paper/blockface.json"),

	[EnumType.ENDERDRAGONPHASE]: newEnumDetail("paper/enderdragonphase.json"),

	[EnumType.DRAGONBATTLERESPAWNPHASE]: newEnumDetail("paper/dragonbattlerespawnphase.json"),

	[EnumType.POTIONEFFECTTYPE]: newEnumDetail("paper/potioneffecttype.json"),

	[EnumType.WORLDENVIRONMENT]: newEnumDetail("paper/worldenvironment.json"),

	[EnumType.ENTITYTYPE]: newEnumDetail("paper/entitytype.json"),

	[EnumType.GAMEMODE]: newEnumDetail("paper/gamemode.json"),

	[EnumType.SPAWNREASON]: newEnumDetail("paper/spawnreason.json"),

	[EnumType.ENCHANTMENT]: newEnumDetail("paper/enchantment.json"),

	[EnumType.ITEMFLAG]: newEnumDetail("paper/itemflag.json"),

	[EnumType.SOUNDCATEGORY]: newEnumDetail("paper/soundcategory.json"),

	[EnumType.FIREWORKEFFECTTYPE]: newEnumDetail("paper/fireworkeffecttype.json"),

	[EnumType.FLUIDCOLLISIONMODE]: newEnumDetail("paper/fluidcollisionmode.json"),



	[EnumType.ADDTRADE_ACTION]: newEnumDetail("mythic/mechanicScoped/addtrade_action.json", false),
	[EnumType.DISPLAYTRANSFORMATION_ACTION]: newEnumDetail("mythic/mechanicScoped/displaytransformation_action.json", false),
	[EnumType.DISPLAYTRANSFORMATION_TYPE]: newEnumDetail("mythic/mechanicScoped/displaytransformation_type.json", false),
	[EnumType.PROJECTILE_BULLETTYPE]: newEnumDetail("mythic/mechanicScoped/projectile_bullettype.json", false),
	[EnumType.PROJECTILE_TYPE]: newEnumDetail("mythic/mechanicScoped/projectile_type.json", false),
	[EnumType.PROJECTILE_HIGHACCURACYMODE]: newEnumDetail("mythic/mechanicScoped/projectile_highaccuracymode.json", false),
	[EnumType.MODIFYPROJECTILE_ACTION]: newEnumDetail("mythic/mechanicScoped/modifyprojectile_action.json", false),
	[EnumType.MODIFYPROJECTILE_TRAIT]: newEnumDetail("mythic/mechanicScoped/modifyprojectile_trait.json", false),
	[EnumType.PUSHBLOCK_DIRECTION]: newEnumDetail("mythic/mechanicScoped/pushblock_direction.json", false),
	[EnumType.SENDTOAST_FRAME]: newEnumDetail("mythic/mechanicScoped/sendtoast_frame.json", false),
	[EnumType.SETLEVEL_ACTION]: newEnumDetail("mythic/mechanicScoped/setlevel_action.json", false),
	[EnumType.SETMAXHEALTH_MODE]: newEnumDetail("mythic/mechanicScoped/setmaxhealth_mode.json", false),
	[EnumType.SHOOT_TYPE]: newEnumDetail("mythic/mechanicScoped/shoot_type.json", false),
	[EnumType.SHOOTFIREBALL_TYPE]: newEnumDetail("mythic/mechanicScoped/shootfireball_type.json", false),
	[EnumType.THREAT_MODE]: newEnumDetail("mythic/mechanicScoped/threat_mode.json", false),
	[EnumType.TIME_MODE]: newEnumDetail("mythic/mechanicScoped/time_mode.json", false),
	[EnumType.VELOCITY_MODE]: newEnumDetail("mythic/mechanicScoped/velocity_mode.json", false),
	[EnumType.VOLLEY_SOURCE]: newEnumDetail("mythic/mechanicScoped/volley_source.json", false),
	[EnumType.WEATHER_TYPE]: newEnumDetail("mythic/mechanicScoped/weather_type.json", false),
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
	dataset?: EnumType;
	values?: string[];
}


export const keyAliases = {
	"Skills": ["Skills", "FurnitureSkills", "InitSkills", "QuitSkills", "LevelSkills", "CustomBlockSkills"],
	"Conditions": ["Conditions", "TriggerConditions", "TargetConditions"]
};


export function generateNumbersInRange(min: number, max: number, step: number, float: boolean = false, start: number|null = null): string[] {
	const result = [];
	
	if (start) {
		result.push(start.toString());
		min += step;
	}

	if (!float) {
		for (let i = min; i <= max; i += step) {
			result.push(i.toString());
		}
		return result;
	}

	for (let i = min; i <= max; i += step) {
		result.push(i.toFixed(2).toString());
	}
	return result;
}