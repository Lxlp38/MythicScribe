import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ctx } from './MythicScribe';
import * as config from './imports/utils/configutils';


export enum ObjectType {
	MECHANIC = 'Mechanic',
	ATTRIBUTE = 'Attribute',
	TARGETER = 'Targeter',
	CONDITION = 'Condition',
	INLINECONDITION = 'Inline Condition',
	TRIGGER = 'Trigger',



}


// Define the paths to your local datasets
const mechanicsDatasetPath = path.join(__dirname, '../data/mechanics.json');
const targetersDatasetPath = path.join(__dirname, '../data/targeters.json');
const conditionsDatasetPath = path.join(__dirname, '../data/conditions.json');
const triggersDatasetPath = path.join(__dirname, '../data/triggers.json');

export const ObjectInfo: { [key in ObjectType]: { dataset: any; datasetMap: Map<string, any>; datasetClassMap: Map<string, any>, regex: RegExp } } = {
	[ObjectType.MECHANIC]: {
		dataset: JSON.parse(fs.readFileSync(mechanicsDatasetPath, 'utf8')),
		datasetMap: new Map<string, any>(),
		datasetClassMap: new Map<string, any>(),
		regex: /(?<=\s- )[\w:]+(?=[\s{])/gm,
	},
	[ObjectType.ATTRIBUTE]: {
		dataset: null,
		datasetMap: new Map<string, any>(),
		datasetClassMap: new Map<string, any>(),
		regex: /(?<=[{;])\w+(?==)/gm,
	},
	[ObjectType.TARGETER]: {
		dataset: JSON.parse(fs.readFileSync(targetersDatasetPath, 'utf8')),
		datasetMap: new Map<string, any>(),
		datasetClassMap: new Map<string, any>(),
		regex: /(?<=\s@)[\w:]+/gm,
	},
	[ObjectType.CONDITION]: {
		dataset: JSON.parse(fs.readFileSync(conditionsDatasetPath, 'utf8')),
		datasetMap: new Map<string, any>(),
		datasetClassMap: new Map<string, any>(),
		regex: /(?<=[\s\|\&][-\(\|\&\)] )[\w:]+/gm,
	},
	[ObjectType.INLINECONDITION]: {
		dataset: JSON.parse(fs.readFileSync(conditionsDatasetPath, 'utf8')),
		datasetMap: new Map<string, any>(),
		datasetClassMap: new Map<string, any>(),
		regex: /(?<=\s(\?)|(\?!)|(\?~)|(\?~!))[\w:]+/gm,
	},
	[ObjectType.TRIGGER]: {
		dataset: JSON.parse(fs.readFileSync(triggersDatasetPath, 'utf8')),
		datasetMap: new Map<string, any>(),
		datasetClassMap: new Map<string, any>(),
		regex: /(?<=\s~)on[\w:]+/gm,
	}
}

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


export const EnumInfo: { [key in EnumType]: { path: any; dataset: any; commalist: string } } = {

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


// GitHub URL to fetch data from
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/Lxlp38/MythicScribe/master/data/';
const GITHUB_API_COMMITS_URL = 'https://api.github.com/repos/Lxlp38/MythicScribe/commits?path=data';

// Function to fetch the latest commit hash from GitHub
async function fetchLatestCommitHash(): Promise<string | null> {
	try {
		const response = await fetch(GITHUB_API_COMMITS_URL);
		const data = await response.json();
		if (Array.isArray(data) && data.length > 0 && typeof data[0].sha === 'string') {
			return data[0].sha;
		} else {
			throw new Error("Unexpected data format");
		}
	} catch (error) {
		console.error("Error fetching commit hash:", error);
		return null;
	}
}

// Function to fetch the JSON data from GitHub
async function fetchJsonFromGithub(filename: string): Promise<any | null> {
	try {
		const response = await fetch(`${GITHUB_BASE_URL}${filename}`);
		if (response.ok) {
			return await response.json();
		} else {
			throw new Error(`Failed to fetch ${filename} from GitHub`);
		}
	} catch (error) {
		console.error(error);
		return null;
	}
}

// Function to load datasets, check globalState, and update if necessary
export async function loadGithubDatasets(context: vscode.ExtensionContext) {
	const globalState = context.globalState;

	if (config.datasetSource() === 'GitHub') {
		// Fetch the latest commit hash from GitHub
		const latestCommitHash = await fetchLatestCommitHash();

		// Retrieve the commit hash from globalState
		const savedCommitHash = globalState.get<string>('latestCommitHash');

		// Check if we need to update the datasets (globalState is empty or outdated)
		if (!savedCommitHash || latestCommitHash !== savedCommitHash) {
			// Try to fetch all datasets from GitHub
			const mechanicsData = await fetchJsonFromGithub('mechanics.json');
			const targetersData = await fetchJsonFromGithub('targeters.json');
			const conditionsData = await fetchJsonFromGithub('conditions.json');
			const triggersData = await fetchJsonFromGithub('triggers.json');

			const enummap: Map<EnumType, any> = new Map<EnumType, any>();
			for (const key of Object.keys(EnumType) as Array<keyof typeof EnumType>) {
				const enumData = await fetchJsonFromGithub(EnumInfo[EnumType[key]].path);
				enummap.set(EnumType[key], enumData);
			}

			console.log("Fetched datasets from GitHub");

			// Check if the data was successfully fetched
			if (mechanicsData && targetersData && conditionsData) {
				// Save datasets to globalState
				console.log("Updating globalState with fetched datasets");
				globalState.update('mechanicsDataset', mechanicsData);
				globalState.update('targetersDataset', targetersData);
				globalState.update('conditionsDataset', conditionsData);
				globalState.update('triggersDataset', triggersData);

				for (const [key, value] of enummap) {
					globalState.update(EnumInfo[key].path, value);
				}

				globalState.update('latestCommitHash', latestCommitHash);
			} else {
				// Fallback to globalState or local datasets if fetch failed
				console.warn("No connection with GitHub could be enstablished. Using globalState or local datasets as a fallback");
			}
		}

		// Load datasets from globalState or fallback to local datasets if necessary
		ObjectInfo[ObjectType.MECHANIC].dataset = globalState.get('mechanicsDataset') || loadLocalDataset(mechanicsDatasetPath);
		ObjectInfo[ObjectType.TARGETER].dataset = globalState.get('targetersDataset') || loadLocalDataset(targetersDatasetPath);
		ObjectInfo[ObjectType.CONDITION].dataset = globalState.get('conditionsDataset') || loadLocalDataset(conditionsDatasetPath);
		ObjectInfo[ObjectType.TRIGGER].dataset = globalState.get('triggersDataset') || loadLocalDataset(triggersDatasetPath);

		for (const key of Object.keys(EnumType) as Array<keyof typeof EnumType>) {
			EnumInfo[EnumType[key]].dataset = globalState.get(EnumInfo[EnumType[key]].path) || loadLocalDataset(path.join(__dirname, '../data/', EnumInfo[EnumType[key]].path));
		}	

	} else {
		// Load datasets from local files
		ObjectInfo[ObjectType.MECHANIC].dataset = loadLocalDataset(mechanicsDatasetPath);
		ObjectInfo[ObjectType.TARGETER].dataset = loadLocalDataset(targetersDatasetPath);
		ObjectInfo[ObjectType.CONDITION].dataset = loadLocalDataset(conditionsDatasetPath);
		ObjectInfo[ObjectType.TRIGGER].dataset = loadLocalDataset(triggersDatasetPath);
	
		for (const key of Object.keys(EnumType) as Array<keyof typeof EnumType>) {
			EnumInfo[EnumType[key]].dataset = loadLocalDataset(path.join(__dirname, '../data/', EnumInfo[EnumType[key]].path));
		}
	
	}

	// Update the maps
	updateDatasets();
	return;
}

export function updateDatasets() {
	updateDatasetMaps();
	updateDatasetEnums();

}

function updateDatasetMaps() {

	ObjectInfo[ObjectType.MECHANIC].datasetMap = new Map<string, any>();
	ObjectInfo[ObjectType.MECHANIC].datasetClassMap = new Map<string, any>();

	ObjectInfo[ObjectType.TARGETER].datasetMap = new Map<string, any>();
	ObjectInfo[ObjectType.TARGETER].datasetClassMap = new Map<string, any>();

	ObjectInfo[ObjectType.CONDITION].datasetMap = new Map<string, any>();
	ObjectInfo[ObjectType.CONDITION].datasetClassMap = new Map<string, any>();

	ObjectInfo[ObjectType.TRIGGER].datasetMap = new Map<string, any>();
	ObjectInfo[ObjectType.TRIGGER].datasetClassMap = new Map<string, any>();

	mapDataset(ObjectInfo[ObjectType.MECHANIC]);
	mapDataset(ObjectInfo[ObjectType.TARGETER]);
	mapDataset(ObjectInfo[ObjectType.CONDITION]);
	mapDataset(ObjectInfo[ObjectType.TRIGGER]);

	ObjectInfo[ObjectType.INLINECONDITION].dataset = ObjectInfo[ObjectType.CONDITION].dataset;
	ObjectInfo[ObjectType.INLINECONDITION].datasetMap = ObjectInfo[ObjectType.CONDITION].datasetMap;
	ObjectInfo[ObjectType.INLINECONDITION].datasetClassMap = ObjectInfo[ObjectType.CONDITION].datasetClassMap;
}

function updateDatasetEnums() {

	for (const key in EnumInfo) {
		const list: string[] = [];
		for (const item of Object.keys(EnumInfo[key as EnumType].dataset)) {
			list.push(item);
		}
		EnumInfo[key as EnumType].commalist = list.join(",");
	}
}

function mapDataset(object: any) {
	for (const mechanic of object.dataset) {
		for (const name of mechanic.name) {
			object.datasetMap.set(name, mechanic);
		}
		object.datasetClassMap.set(mechanic.class.toLowerCase(), mechanic);
	}
}

function loadLocalDataset(datasetPath: string): any {
	try {
		return JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
	} catch (error) {
		console.error(`Error reading local dataset: ${datasetPath}`, error);
		return null;
	}
}

// Different types of objects that can be found in a configuration

export const ConditionActions = {
	"true": {
		"type": "check",
	},
	"false": {
		"type": "check",
	},
	"cast": {
		"type": "metaskill",
	},
	"castinstead": {
		"type": "metaskill",
	},
	"orElseCast": {
		"type": "metaskill",
	},
	"power": {
		"type": "float",
	}
}

export const MetaskillFileObjects = {
	"Skills": {
		"type": "list",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#skills",
		"description": "The list of the mechanics that will be executed by the metaskill.",
	},
	"Conditions": {
		"type": "list",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#conditions",
		"description": "The list of conditions that will evaluate the caster of the metaskill before execution.",
	},
	"TargetConditions": {
		"type": "list",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#targetconditions",
		"description": "The list of conditions that will evaluate the target of the metaskill before execution",
	},
	"TriggerConditions": {
		"type": "list",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#triggerconditions",
		"description": "The list of conditions that will evaluate the trigger of the metaskill before execution",
	},
	"Cooldown": {
		"type": "float",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#cooldown",
		"description": "The cooldown of the metaskill (in seconds).",
	},
	"CancelIfNoTargets": {
		"type": "bool",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#cancelifnotargets",
		"description": "Whether the metaskill should be cancelled if there are no targets.",
	},
	"FailedConditionsSkill": {
		"type": "string",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#failedconditionsskill",
		"description": "The name of the metaskill to cast if the conditions fail.",
	},
	"OnCooldownSkill": {
		"type": "string",
		"link": "https://git.lumine.io/mythiccraft/MythicMobs/-/wikis/Skills/Metaskills#oncooldownskill",
		"description": "The name of the metaskill to cast if the metaskill is on cooldown.",
	},
}

export const keyAliases = {
	"Skills": ["Skills", "FurnitureSkills", "InitSkills", "QuitSkills", "LevelSkills", "CustomBlockSkills"],
	"Conditions": ["Conditions", "TriggerConditions", "TargetConditions"]
}