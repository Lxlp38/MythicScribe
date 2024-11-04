import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ctx } from './MythicScribe';


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

}


export const EnumInfo: { [key in EnumType]: { dataset: any; commalist: string } } = {

	[EnumType.SOUND]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/minecraft/sounds.json'), 'utf8')),
		commalist: "",
	},

	[EnumType.AUDIENCE]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/audiences.json'), 'utf8')),
		commalist: "",
	},

	[EnumType.EQUIPSLOT]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/equipslot.json'), 'utf8')),
		commalist: "",
	},

	[EnumType.PARTICLE]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/particles.json'), 'utf8')),
		commalist: "",
	},

	[EnumType.STATMODIFIER]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/statsmodifiers.json'), 'utf8')),
		commalist: "",
	},

	[EnumType.SPIGOTATTRIBUTE]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/attributes.json'), 'utf8')),
		commalist: ""
	},

	[EnumType.SPIGOTATTRIBUTEOPERATION]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/attributesoperations.json'), 'utf8')),
		commalist: ""
	},

	[EnumType.BARCOLOR]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/barcolor.json'), 'utf8')),
		commalist: ""
	},

	[EnumType.BARSTYLE]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/barstyle.json'), 'utf8')),
		commalist: ""
	},

	[EnumType.DAMAGECAUSE]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/damagecause.json'), 'utf8')),
		commalist: ""
	},

	[EnumType.DYE]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/dye.json'), 'utf8')),
		commalist: ""
	},

	[EnumType.MATERIAL]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/material.json'), 'utf8')),
		commalist: ""
	},

	[EnumType.BLOCKFACE]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/blockface.json'), 'utf8')),
		commalist: ""
	},
	
	[EnumType.ENDERDRAGONPHASE]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/enderdragonphase.json'), 'utf8')),
		commalist: ""
	},
	
	[EnumType.DRAGONBATTLERESPAWNPHASE]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/dragonbattlerespawnphase.json'), 'utf8')),
		commalist: ""
	},

	[EnumType.POTIONEFFECTTYPE]: {
		dataset: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/spigot/potioneffecttype.json'), 'utf8')),
		commalist: ""
	},

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

		const soundsData = await fetchJsonFromGithub('minecraft/sounds.json');

		const audiencesData = await fetchJsonFromGithub('audiences.json');
		const equipslotData = await fetchJsonFromGithub('equipslot.json');
		const particlesData = await fetchJsonFromGithub('particles.json');
		const statsmodifiersData = await fetchJsonFromGithub('statsmodifiers.json');

		const attributesData = await fetchJsonFromGithub('spigot/attributes.json');
		const attrinutesOperationsData = await fetchJsonFromGithub('spigot/attributesoperations.json');
		const barcolorData = await fetchJsonFromGithub('spigot/barcolor.json');
		const barstyleData = await fetchJsonFromGithub('spigot/barstyle.json');
		const damagecauseData = await fetchJsonFromGithub('spigot/damagecause.json');
		const dyeData = await fetchJsonFromGithub('spigot/dye.json');
		const materialData = await fetchJsonFromGithub('spigot/material.json');
		const blockfaceData = await fetchJsonFromGithub('spigot/blockface.json');
		const enderdragonphaseData = await fetchJsonFromGithub('spigot/enderdragonphase.json');
		const dragonbattlerespawnphaseData = await fetchJsonFromGithub('spigot/dragonbattlerespawnphase.json');
		const potioneffecttypeData = await fetchJsonFromGithub('spigot/potioneffecttype.json');
		
		console.log("Fetched datasets from GitHub");

        // Check if the data was successfully fetched
        if (mechanicsData && targetersData && conditionsData) {
            // Save datasets to globalState
			console.log("Updating globalState with fetched datasets");
            globalState.update('mechanicsDataset', mechanicsData);
            globalState.update('targetersDataset', targetersData);
            globalState.update('conditionsDataset', conditionsData);
			globalState.update('triggersDataset', triggersData);

			globalState.update('soundsDataset', soundsData);

			globalState.update('audiencesDataset', audiencesData);
			globalState.update('equipslotDataset', equipslotData);
			globalState.update('particlesDataset', particlesData);
			globalState.update('statsmodifiersDataset', statsmodifiersData);

			globalState.update('attributesDataset', attributesData);
			globalState.update('attributesOperationsDataset', attrinutesOperationsData);
			globalState.update('barcolorDataset', barcolorData);
			globalState.update('barstyleDataset', barstyleData);
			globalState.update('damagecauseDataset', damagecauseData);
			globalState.update('dyeDataset', dyeData);
			globalState.update('materialDataset', materialData);
			globalState.update('blockfaceDataset', blockfaceData);
			globalState.update('enderdragonphaseDataset', enderdragonphaseData);
			globalState.update('dragonbattlerespawnphaseDataset', dragonbattlerespawnphaseData);
			globalState.update('potioneffecttypeDataset', potioneffecttypeData);

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

	EnumInfo[EnumType.SOUND].dataset = globalState.get('soundsDataset') || loadLocalDataset(path.join(__dirname, '../data/minecraft/sounds.json'));

	EnumInfo[EnumType.AUDIENCE].dataset = globalState.get('audiencesDataset') || loadLocalDataset(path.join(__dirname, '../data/audiences.json'));
	EnumInfo[EnumType.EQUIPSLOT].dataset = globalState.get('equipslotDataset') || loadLocalDataset(path.join(__dirname, '../data/equipslot.json'));
	EnumInfo[EnumType.PARTICLE].dataset = globalState.get('particlesDataset') || loadLocalDataset(path.join(__dirname, '../data/particles.json'));
	EnumInfo[EnumType.STATMODIFIER].dataset = globalState.get('statsmodifiersDataset') || loadLocalDataset(path.join(__dirname, '../data/statsmodifiers.json'));

	EnumInfo[EnumType.SPIGOTATTRIBUTE].dataset = globalState.get('attributesDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/attributes.json'));
	EnumInfo[EnumType.SPIGOTATTRIBUTEOPERATION].dataset = globalState.get('attributesOperationsDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/attributesoperations.json'));
	EnumInfo[EnumType.BARCOLOR].dataset = globalState.get('barcolorDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/barcolor.json'));
	EnumInfo[EnumType.BARSTYLE].dataset = globalState.get('barstyleDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/barstyle.json'));
	EnumInfo[EnumType.DAMAGECAUSE].dataset = globalState.get('damagecauseDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/damagecause.json'));
	EnumInfo[EnumType.DYE].dataset = globalState.get('dyeDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/dye.json'));
	EnumInfo[EnumType.MATERIAL].dataset = globalState.get('materialDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/material.json'));
	EnumInfo[EnumType.BLOCKFACE].dataset = globalState.get('blockfaceDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/blockface.json'));
	EnumInfo[EnumType.ENDERDRAGONPHASE].dataset = globalState.get('enderdragonphaseDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/enderdragonphase.json'));
	EnumInfo[EnumType.DRAGONBATTLERESPAWNPHASE].dataset = globalState.get('dragonbattlerespawnphaseDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/dragonbattlerespawnphase.json'));
	EnumInfo[EnumType.POTIONEFFECTTYPE].dataset = globalState.get('potioneffecttypeDataset') || loadLocalDataset(path.join(__dirname, '../data/spigot/potioneffecttype.json'));

	// Update the maps
	updateDatasets();
    return;
}

export function updateDatasets(){
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