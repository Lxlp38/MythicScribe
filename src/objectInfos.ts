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


interface Attribute {
	name: string[];
	type: string;
	enum: string | null;
	list: boolean;
	description: string;
	link: string;
	default_value: string;
}

export interface Mechanic {
	plugin: string;
	class: string;
	extends: string;
	name: string[];
	description: string;
	link: string;
	attributes: Attribute[];
	inheritable_attributes: string[];
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
}

/**
 * Enum representing various types used in the MythicScribe application.
 * 
 * @enum {string}
 * @property {string} SOUND - Represents a sound type.
 * @property {string} AUDIENCE - Represents an audience type.
 * @property {string} EQUIPSLOT - Represents an equipment slot type.
 * @property {string} PARTICLE - Represents a particle type.
 * @property {string} STATMODIFIER - Represents a stat modifier type.
 * @property {string} SPIGOTATTRIBUTE - Represents a Spigot attribute type.
 * @property {string} SPIGOTATTRIBUTEOPERATION - Represents a Spigot attribute operation type.
 * @property {string} BARCOLOR - Represents a bar color type.
 * @property {string} BARSTYLE - Represents a bar style type.
 * @property {string} DAMAGECAUSE - Represents a damage cause type.
 * @property {string} DYE - Represents a dye type.
 * @property {string} MATERIAL - Represents a material type.
 * @property {string} BLOCKFACE - Represents a block face type.
 * @property {string} ENDERDRAGONPHASE - Represents an Ender Dragon phase type.
 * @property {string} DRAGONBATTLERESPAWNPHASE - Represents a Dragon Battle respawn phase type.
 * @property {string} POTIONEFFECTTYPE - Represents a potion effect type.
 * @property {string} WORLDENVIRONMENT - Represents a world environment type.
 * @property {string} ENTITYTYPE - Represents an entity type.
 * @property {string} GAMEMODE - Represents a game mode type.
 * @property {string} SPAWNREASON - Represents a spawn reason type.
 */
export enum EnumType {
	// Enums

	SOUND = 'Sound',

	AUDIENCE = 'Audience',
	EQUIPSLOT = 'Equip Slot',
	PARTICLE = 'Particle',
	STATMODIFIER = 'Stat Modifier',

	SPIGOTATTRIBUTE = 'Spigot Attribute',
	SPIGOTATTRIBUTEOPERATION = 'Spigot Attribute Operation',
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
	[key: string]: EnumInfoValue;
}

interface EnumInfoValue {
	path: string;
	dataset: EnumInfoValueDataset;
	commalist: string;
}

export interface EnumInfoValueDataset {
	[key: string]: EnumInfovalueDatasetValue;
}

export interface EnumInfovalueDatasetValue {
	Description?: string;
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

	[EnumType.SPIGOTATTRIBUTE]: {
		path: "spigot/attributes.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.SPIGOTATTRIBUTEOPERATION]: {
		path: "spigot/attributesoperations.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.BARCOLOR]: {
		path: "spigot/barcolor.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.BARSTYLE]: {
		path: "spigot/barstyle.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.DAMAGECAUSE]: {
		path: "spigot/damagecause.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.DYE]: {
		path: "spigot/dye.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.MATERIAL]: {
		path: "spigot/material.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.BLOCKFACE]: {
		path: "spigot/blockface.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.ENDERDRAGONPHASE]: {
		path: "spigot/enderdragonphase.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.DRAGONBATTLERESPAWNPHASE]: {
		path: "spigot/dragonbattlerespawnphase.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.POTIONEFFECTTYPE]: {
		path: "spigot/potioneffecttype.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.WORLDENVIRONMENT]: {
		path: "spigot/worldenvironment.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.ENTITYTYPE]: {
		path: "spigot/entitytype.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.GAMEMODE]: {
		path: "spigot/gamemode.json",
		dataset: {},
		commalist: ""
	},

	[EnumType.SPAWNREASON]: {
		path: "spigot/spawnreason.json",
		dataset: {},
		commalist: ""
	}

}




// Different types of objects that can be found in a configuration

enum ConditionTypes {
	CHECK = "check",
	METASKILL = "metaskill",
	FLOAT = "float",
}

export const ConditionActions: { [key: string]: ConditionTypes } = {
	"true": ConditionTypes.CHECK,
	"false": ConditionTypes.CHECK,
	"cast": ConditionTypes.METASKILL,
	"castinstead": ConditionTypes.METASKILL,
	"orElseCast": ConditionTypes.METASKILL,
	"power": ConditionTypes.FLOAT
}





export enum FileObjectTypes {
	BOOLEAN = 'boolean',
	STRING = 'string',
	INTEGER = 'integer',
	FLOAT = 'float',
	LIST = 'list',
	KEY = 'key',
	BARCOLOR = 'barcolor',
	BARSTYLE = 'barstyle',
	KEY_DATASET = 'key_dataset',
}

interface FileObjectMap {
	[key: string]: FileObject;
}

interface FileObject {
	type: FileObjectTypes;
	link: string;
	description: string;
	keys?: { [key: string]: FileObjectKey };
	dataset?: EnumType;
}

interface FileObjectKey {
	type: FileObjectTypes;
}


export const MetaskillFileObjects: FileObjectMap = {
	"Skills": {
		"type": FileObjectTypes.LIST,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#skills",
		"description": "The list of the mechanics that will be executed by the metaskill.",
	},
	"Conditions": {
		"type": FileObjectTypes.LIST,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#conditions",
		"description": "The list of conditions that will evaluate the caster of the metaskill before execution.",
	},
	"TargetConditions": {
		"type": FileObjectTypes.LIST,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#targetconditions",
		"description": "The list of conditions that will evaluate the target of the metaskill before execution",
	},
	"TriggerConditions": {
		"type": FileObjectTypes.LIST,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#triggerconditions",
		"description": "The list of conditions that will evaluate the trigger of the metaskill before execution",
	},
	"Cooldown": {
		"type": FileObjectTypes.FLOAT,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#cooldown",
		"description": "The cooldown of the metaskill (in seconds).",
	},
	"CancelIfNoTargets": {
		"type": FileObjectTypes.BOOLEAN,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#cancelifnotargets",
		"description": "Whether the metaskill should be cancelled if there are no targets.",
	},
	"FailedConditionsSkill": {
		"type": FileObjectTypes.STRING,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#failedconditionsskill",
		"description": "The name of the metaskill to cast if the conditions fail.",
	},
	"OnCooldownSkill": {
		"type": FileObjectTypes.STRING,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#oncooldownskill",
		"description": "The name of the metaskill to cast if the metaskill is on cooldown.",
	},
}

export const MobFileObject: FileObjectMap = {
	"Type": {
		"type": FileObjectTypes.STRING,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#type",
		"description": "The type of the mob.",
	},
	"Template": {
		"type": FileObjectTypes.STRING,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Templates",
		"description": "The templates for the mob.",
	},
	"Display": {
		"type": FileObjectTypes.STRING,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#display",
		"description": "The display name of the mob.",
	},
	"Health": {
		"type": FileObjectTypes.FLOAT,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#health",
		"description": "The health of the mob.",
	},
	"Damage": {
		"type": FileObjectTypes.FLOAT,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#damage",
		"description": "The damage of the mob.",
	},
	"Armor": {
		"type": FileObjectTypes.FLOAT,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#armor",
		"description": "The armor points of the mob.",
	},
	"HealthBar": {
		"type": FileObjectTypes.KEY,
		"keys": {
			"Enabled": {
				"type": FileObjectTypes.BOOLEAN,
			},
			"Offset": {
				"type": FileObjectTypes.FLOAT,
			}
		},
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#healthbar",
		"description": "The health bar of the mob.",
	},
	"BossBar": {
		"type": FileObjectTypes.KEY,
		"keys": {
			"Enabled": {
				"type": FileObjectTypes.BOOLEAN,
			},
			"Title": {
				"type": FileObjectTypes.STRING,
			},
			"Range": {
				"type": FileObjectTypes.FLOAT,
			},
			"Color": {
				"type": FileObjectTypes.BARCOLOR,
			},
			"Style": {
				"type": FileObjectTypes.BARSTYLE,
			},
			"CreateFog": {
				"type": FileObjectTypes.BOOLEAN,
			},
			"DarkenSky": {
				"type": FileObjectTypes.BOOLEAN,
			},
			"PlayMusic": {
				"type": FileObjectTypes.BOOLEAN,
			}
		},
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#bossbar",
		"description": "The boss bar of the mob.",
	},
	"Faction": {
		"type": FileObjectTypes.STRING,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#faction",
		"description": "The faction of the mob.",
	},
	"Mount": {
		"type": FileObjectTypes.STRING,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#mount",
		"description": "The mount of the mob.",
	},
	"Options": {
		"type": FileObjectTypes.KEY_DATASET,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Options",
		"description": "The options of the mob.",
	},
	"Modules": {
		"type": FileObjectTypes.KEY,
		"keys": {
			"ThreatTable": {
				"type": FileObjectTypes.BOOLEAN,
			},
			"ImmunityTable": {
				"type": FileObjectTypes.FLOAT,
			},
		},
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#modules",
		"description": "The modules of the mob.",
	},
}


export const keyAliases = {
	"Skills": ["Skills", "FurnitureSkills", "InitSkills", "QuitSkills", "LevelSkills", "CustomBlockSkills"],
	"Conditions": ["Conditions", "TriggerConditions", "TargetConditions"]
}