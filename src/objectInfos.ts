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

}

interface EnumInfo {
	[key: string]: EnumDetail ;
}

interface EnumDetail  {
	readonly path: string;
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

function newEnumDetail(path: string) : EnumDetail {
	return {
		path: path,
		dataset: {},
		commalist: ""
	};
}

export const EnumInfo = {

	[EnumType.SOUND]: newEnumDetail("minecraft/sounds.json"),

	[EnumType.AUDIENCE]: newEnumDetail("audiences.json"),

	[EnumType.EQUIPSLOT]: newEnumDetail("equipslot.json"),

	[EnumType.PARTICLE]: newEnumDetail("particles.json"),

	[EnumType.STATMODIFIER]: newEnumDetail("statsmodifiers.json"),

	[EnumType.PAPERATTRIBUTE]: newEnumDetail("paper/attributes.json"),

	[EnumType.PAPERATTRIBUTEOPERATION]: newEnumDetail("attributesoperations.json"),

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

	[EnumType.SOUNDCATEGORY]: newEnumDetail("paper/soundcategory.json")
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
