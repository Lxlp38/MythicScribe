import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as config from './imports/utils/configutils';

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
	extends: string;
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

}


interface EnumInfo {
	[key: string]: EnumDetail ;
}

interface EnumDetail  {
	path: string;
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

export const EnumInfo = {

	[EnumType.SOUND]: {
		path: "minecraft/sounds.json",
		dataset: {},
		commalist: "",
	},

	[EnumType.AUDIENCE]: {
		path: "audiences.json",
		dataset: {},
		commalist: "",
	},

	[EnumType.EQUIPSLOT]: {
		path: "equipslot.json",
		dataset: {},
		commalist: "",
	},

	[EnumType.PARTICLE]: {
		path: "particles.json",
		dataset: {},
		commalist: "",
	},

	[EnumType.STATMODIFIER]: {
		path: "statsmodifiers.json",
		dataset: {},
		commalist: "",
	},

	[EnumType.PAPERATTRIBUTE]: {
		path: "paper/attributes.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.PAPERATTRIBUTEOPERATION]: {
		path: "attributesoperations.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.BARCOLOR]: {
		path: "paper/barcolor.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.BARSTYLE]: {
		path: "paper/barstyle.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.DAMAGECAUSE]: {
		path: "paper/damagecause.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.DYE]: {
		path: "paper/dye.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.MATERIAL]: {
		path: "paper/material.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.BLOCKFACE]: {
		path: "paper/blockface.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.ENDERDRAGONPHASE]: {
		path: "paper/enderdragonphase.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.DRAGONBATTLERESPAWNPHASE]: {
		path: "paper/dragonbattlerespawnphase.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.POTIONEFFECTTYPE]: {
		path: "paper/potioneffecttype.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.WORLDENVIRONMENT]: {
		path: "paper/worldenvironment.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.ENTITYTYPE]: {
		path: "paper/entitytype.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.GAMEMODE]: {
		path: "paper/gamemode.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.SPAWNREASON]: {
		path: "paper/spawnreason.json",
		dataset: {},
		commalist: ""
	}

};




// Different types of objects that can be found in a configuration




export enum FileObjectTypes {
	BOOLEAN = 'boolean',
	STRING = 'string',
	INTEGER = 'integer',
	FLOAT = 'float',
	VECTOR = 'vector',

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


export function generateIntInRange(min: number, max: number, step: number, float: boolean = false): string[] {
	const result = [];
	
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
