import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ctx } from './MythicScribe';


// Define the paths to your local datasets
export const mechanicsDatasetPath = path.join(__dirname, '../data/mechanics.json');
export const targetersDatasetPath = path.join(__dirname, '../data/targeters.json');
export const conditionsDatasetPath = path.join(__dirname, '../data/conditions.json');

export let mechanicsDataset = JSON.parse(fs.readFileSync(mechanicsDatasetPath, 'utf8'));
export let targetersDataset = JSON.parse(fs.readFileSync(targetersDatasetPath, 'utf8'));
export let conditionsDataset = JSON.parse(fs.readFileSync(conditionsDatasetPath, 'utf8'));

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
export async function loadDatasets(context: vscode.ExtensionContext) {
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
		console.log("Fetched datasets from GitHub");

        // Check if the data was successfully fetched
        if (mechanicsData && targetersData && conditionsData) {
            // Save datasets to globalState
			console.log("Updating globalState with fetched datasets");
            globalState.update('mechanicsDataset', mechanicsData);
            globalState.update('targetersDataset', targetersData);
            globalState.update('conditionsDataset', conditionsData);
            globalState.update('latestCommitHash', latestCommitHash);
        } else {
            // Fallback to globalState or local datasets if fetch failed
            console.warn("No connection with GitHub could be enstablished. Using globalState or local datasets as a fallback");
        }
    }

    // Load datasets from globalState or fallback to local datasets if necessary
    mechanicsDataset = globalState.get('mechanicsDataset') || loadLocalDataset(mechanicsDatasetPath);
    targetersDataset = globalState.get('targetersDataset') || loadLocalDataset(targetersDatasetPath);
    conditionsDataset = globalState.get('conditionsDataset') || loadLocalDataset(conditionsDatasetPath);

    return { mechanicsDataset, targetersDataset, conditionsDataset };
}

function loadLocalDataset(datasetPath: string): any {
    try {
        return JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    } catch (error) {
        console.error(`Error reading local dataset: ${datasetPath}`, error);
        return null;
    }
}


export enum ObjectType {
	MECHANIC = 'Mechanic',
	ATTRIBUTE = 'Attribute',
	TARGETER = 'Targeter',
	CONDITION = 'Condition',
	INLINECONDITION = 'Inline Condition',
}


export const ObjectInfo = {
	[ObjectType.MECHANIC]: {
		dataset: mechanicsDataset,
		regex: /(?<=\s- )[\w:]+(?=[\s{])/gm,
	},
	[ObjectType.ATTRIBUTE]: {
		dataset: mechanicsDataset,
		regex: /(?<=[{;])\w+(?==)/gm,
	},
	[ObjectType.TARGETER]: {
		dataset: targetersDataset,
		regex: /(?<=\s@)[\w:]+/gm,
	},
	[ObjectType.CONDITION]: {
		dataset: conditionsDataset,
		regex: /(?<=[\s\|\&][-\(\|\&\)] )[\w:]+/gm,
	},
	[ObjectType.INLINECONDITION]: {
		dataset: conditionsDataset,
		regex: /(?<=\s(\?)|(\?!)|(\?~)|(\?~!))[\w:]+/gm,
	},
}

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

export const SkillFileObjects = {
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