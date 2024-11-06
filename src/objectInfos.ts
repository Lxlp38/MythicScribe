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
	VECTOR = 'vector',

	LIST = 'list',
	
	KEY = 'key',
	KEY_DATASET = 'key_dataset',
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

export const MobFileObjects: FileObjectMap = {
	"Type": {
		"type": FileObjectTypes.STRING,
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Mobs#type",
		"description": "The Entity Type of the mob.",
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
				"type": FileObjectTypes.KEY_DATASET,
				"dataset": EnumType.BARCOLOR,
			},
			"Style": {
				"type": FileObjectTypes.KEY_DATASET,
				"dataset": EnumType.BARSTYLE,
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
		"type": FileObjectTypes.KEY_LIST,
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
	"AIGoalSelectors": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/AIGoalSelectors",
		description: "The AI goal selectors of the mob.",
	},
	"AITargetSelectors": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/AITargetSelectors",
		description: "The AI target selectors of the mob.",
	},
	"Drops": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Drops",
		description: "The drops of the mob.",
	},
	"DamageModifiers": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/DamageModifiers",
		description: "The damage modifiers of the mob.",
	},
	"Equipment": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Equipment",
		description: "The equipment of the mob.",
	},
	"KillMessages": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/KillMessages",
		description: "The kill messages of the mob.",
	},
	"LevelModifiers": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/LevelModifiers",
		description: "The level modifiers of the mob.",
		keys: {
			"Health": {
				type: FileObjectTypes.FLOAT,
			},
			"Damage": {
				type: FileObjectTypes.FLOAT,
			},
			"Armor": {
				type: FileObjectTypes.FLOAT,
			},
			"KnockbackResistance": {
				type: FileObjectTypes.FLOAT,
			},
			"Power": {
				type: FileObjectTypes.FLOAT,
			},
			"MovementSpeed": {
				type: FileObjectTypes.FLOAT,
			}
		}
	},
	"Disguise": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Disguise",
		description: "The disguise of the mob.",
	},
	"Skills": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Skills",
		description: "The skills of the mob.",
	},
	"Nameplate": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Nameplate",
		description: "The nameplate of the mob.",
		keys: {
			"Enabled": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Offset": {
				type: FileObjectTypes.FLOAT,
			},
			"Scale": {
				type: FileObjectTypes.FLOAT,
			},
			"Mounted": {
				type: FileObjectTypes.BOOLEAN,
			},
		}
	},
	"Hearing": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Hearing",
		description: "The hearing of the mob.",
		keys: {
			"Enabled": {
				type: FileObjectTypes.BOOLEAN,
			},
		}
	},
	"Variables": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Variables",
		description: "The variables of the mob.",
	},
	"Trades": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Mobs/Trades",
		description: "The trades of the mob.",
	},

}


export const ItemFileObjects: FileObjectMap = {
	"Id": {
		type: FileObjectTypes.KEY_DATASET,
		dataset: EnumType.MATERIAL,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#id",
		description: "The base material to use for your item",
	},
	"Template": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#template",
		description: "Items can use Templating like mobs, while referencing other items. Only one template can be used at a time",
	},
	"Display": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#display",
		description: "Sets the display name of the item",
	},
	"Lore": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#lore",
		description: "Sets the lore of the item. Allows for placeholders and color gradients",
	},
	"CustomModelData": {
		type: FileObjectTypes.INTEGER,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#custommodeldata",
		description: "Sets the CustomModelData tag on the item",
	},
	"Durability": {
		type: FileObjectTypes.INTEGER,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#durability",
		description: "Sets the amount of durability to take off the item",
	},
	"Attributes": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#attributes",
		description: "Allows the addition of item attributes, such as health, to certain armor slots",
		keys: {
			"All": {
				type: FileObjectTypes.KEY_LIST,
			},
			"MainHand": {
				type: FileObjectTypes.KEY_LIST,
			},
			"OffHand": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Head": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Chest": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Legs": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Feet": {
				type: FileObjectTypes.KEY_LIST,
			}
		}
	},
	"Amount": {
		type: FileObjectTypes.INTEGER,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#amount",
		description: "Sets the default amount of items to give when this item is being called by the plugin",
	},
	"Options": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#options",
		description: "A special field that includes various item options, such as color or append type",
	},
	"Enchantments": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#enchantments",
		description: "Adds enchantments to items. A list of available enchantments is provided in the documentation",
	},
	"Hide": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#hide",
		description: "Allows specific details, like enchantments, to be hidden from the item tooltip",
	},
	"PotionEffects": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#potioneffects",
		description: "Sets the potion effects of the item, applicable to potions, splash potions, and tipped arrows",
	},
	"BannerLayers": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#bannerlayers",
		description: "Sets the banner layers for a banner or shield",
	},
	"CanPlaceOn": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#canplaceon",
		description: "Specifies blocks on which this item can be placed in adventure mode",
	},
	"CanBreak": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#canbreak",
		description: "Specifies blocks that this item can break in adventure mode",
	},
	"Group": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#group",
		description: "Defines the group for browsing items with '/mm items browse'",
	},
	"NBT": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#nbt",
		description: "Adds custom NBT tags to items for data storage or compatibility with other plugins",
	},
	"ArmorTrimNBT": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#armor-trim-nbt",
		description: "Sets custom armor trim for items, like iron chestplates, with specified materials and patterns",
	},
	"Firework": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#firework",
		description: "Configures firework or firework_charge items with colors, flicker, trail, etc.",
	},
	"Book": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#book",
		description: "Configures written books with title, author, and multiple pages",
	},
	"Food": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Items/Items#food",
		description: "Configures food items with attributes like nutrition, saturation, and effects",
		keys: {
			"Nutrition": {
				type: FileObjectTypes.FLOAT,
			},
			"Saturation": {
				type: FileObjectTypes.FLOAT,
			},
			"EatSeconds": {
				type: FileObjectTypes.FLOAT,
			},
			"CanAlwaysEat": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Effects": {
				type: FileObjectTypes.LIST,
			}
		}
	},
	"Skills": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Usage",
		description: "Sets the skills of the item",
	},
	"FurnitureSkills": {
		type: FileObjectTypes.LIST,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture#furniture-skills",
		description: "Sets the furniture skills of the item",
	},
	"CustomDurability": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/CustomDurability",
		description: "Sets the custom durability of the item",
		keys: {
			"Durability": {
				type: FileObjectTypes.INTEGER,
			},
		}
	},
	"Recipes": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Recipes",
		description: "Sets the recipes of the item",
	},
	"AugmentationSlots": {
		type: FileObjectTypes.KEY_LIST,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Augments",
		description: "Sets the augmentation slots of the item",
	},
	"EquipmentSet": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Sets",
		description: "Sets the set of the item",
	},
	"CustomBlock": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Custom-Blocks",
		description: "Sets the custom block of the item",
		keys: {
			"Type": {
				type: FileObjectTypes.STRING,
			},
			"Id": {
				type: FileObjectTypes.INTEGER,
			},
			"Texture": {
				type: FileObjectTypes.STRING,
			},
			"Hardness": {
				type: FileObjectTypes.INTEGER,
			},
			"Tools": {
				type: FileObjectTypes.LIST,
			},
			"Parent": {
				type: FileObjectTypes.STRING,
			},
			"Textures": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Variant": {
				type: FileObjectTypes.LIST,
			}
		}
	},
	"Type": {
		type: FileObjectTypes.STRING,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis",
		description: "Sets the type of the item",
	},
	"Furniture": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Furniture",
		description: "Sets the furniture of the item",
		keys: {
			"Material": {
				type: FileObjectTypes.KEY_DATASET,
				dataset: EnumType.MATERIAL,
			},
			"Model": {
				type: FileObjectTypes.INTEGER,
			},
			"Type": {
				type: FileObjectTypes.STRING,
			},
			"Health": {
				type: FileObjectTypes.INTEGER,
			},
			"Hitbox": {
				type: FileObjectTypes.KEY,
				keys: {
					"Height": {
						type: FileObjectTypes.INTEGER,
					},
					"Width": {
						type: FileObjectTypes.INTEGER,
					},
				}
			},
			"CanRotate": {
				type: FileObjectTypes.BOOLEAN,
			},
			"GlowingItem": {
				type: FileObjectTypes.BOOLEAN,
			},
			"DropSelf": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Color": {
				type: FileObjectTypes.STRING,
			},
			"Colorable": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Placement": {
				type: FileObjectTypes.STRING,
			},
			"Diagonalable": {
				type: FileObjectTypes.BOOLEAN,
			},
			"Barriers": {
				type: FileObjectTypes.LIST,
			},
			"Lights": {
				type: FileObjectTypes.LIST,
			},
			"Seats": {
				type: FileObjectTypes.LIST,
			},
			"Drops": {
				type: FileObjectTypes.LIST,
			},
			"DefaultState": {
				type: FileObjectTypes.STRING,
			},
			"States": {
				type: FileObjectTypes.KEY_LIST,
			},
			"Height": {
				type: FileObjectTypes.INTEGER,
			},
			"Width": {
				type: FileObjectTypes.INTEGER,
			},
			"Billboard": {
				type: FileObjectTypes.STRING,
			},
			"Brightness": {
				type: FileObjectTypes.INTEGER,
			},
			"InterpolationDelay": {
				type: FileObjectTypes.INTEGER,
			},
			"InterpolationDuration": {
				type: FileObjectTypes.INTEGER,
			},
			"Transform": {
				type: FileObjectTypes.STRING,
			},
			"Scale": {
				type: FileObjectTypes.VECTOR,
			},
			"GlowingFrame": {
				type: FileObjectTypes.BOOLEAN,
			}
		}
	},
	"Inventory": {
		type: FileObjectTypes.KEY,
		link: "https://git.lumine.io/mythiccraft/mythiccrucible/-/wikis/Bags",
		description: "Thets the bag options",
		keys: {
			"Title": {
				type: FileObjectTypes.STRING,
			},
			"Size": {
				type: FileObjectTypes.INTEGER,
			}
		}
	},
};

export const keyAliases = {
	"Skills": ["Skills", "FurnitureSkills", "InitSkills", "QuitSkills", "LevelSkills", "CustomBlockSkills"],
	"Conditions": ["Conditions", "TriggerConditions", "TargetConditions"]
}