import * as vscode from 'vscode';
import { ctx } from './MythicScribe';
import * as config from './imports/utils/configutils';
import { EnumInfo, EnumInfoValueDataset, EnumInfovalueDatasetValue, EnumType, Mechanic, MechanicDataset, ObjectInfo, ObjectType } from './objectInfos';
import path from 'path';
import * as fs from 'fs';



// Define the paths to your local datasets
const mechanicsDatasetPath = path.join(__dirname, '../data/mechanics.json');
const targetersDatasetPath = path.join(__dirname, '../data/targeters.json');
const conditionsDatasetPath = path.join(__dirname, '../data/conditions.json');
const triggersDatasetPath = path.join(__dirname, '../data/triggers.json');


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
async function fetchJsonFromGithub(filename: string): Promise<MechanicDataset | EnumInfoValueDataset | unknown | null> {
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

	if (config.datasetSource() === 'GitHub') {
		checkGithubDatasets(context);
	} else {
		loadLocalDatasets();
	}

	updateDatasets();
	return;
}

function loadLocalDatasets() {
	// Load datasets from local files
	ObjectInfo[ObjectType.MECHANIC].dataset = loadLocalMechanicDataset(mechanicsDatasetPath);
	ObjectInfo[ObjectType.TARGETER].dataset = loadLocalMechanicDataset(targetersDatasetPath);
	ObjectInfo[ObjectType.CONDITION].dataset = loadLocalMechanicDataset(conditionsDatasetPath);
	ObjectInfo[ObjectType.TRIGGER].dataset = loadLocalMechanicDataset(triggersDatasetPath);

	for (const key of Object.keys(EnumType) as Array<keyof typeof EnumType>) {
		EnumInfo[EnumType[key]].dataset = loadLocalEnumDataset(path.join(__dirname, '../data/', EnumInfo[EnumType[key]].path));
	}
}

async function checkGithubDatasets(context: vscode.ExtensionContext) {
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

		const enummap: Map<EnumType, EnumInfovalueDatasetValue> = new Map<EnumType, EnumInfovalueDatasetValue>();
		for (const key of Object.keys(EnumType) as Array<keyof typeof EnumType>) {
			const enumData = await fetchJsonFromGithub(EnumInfo[EnumType[key]].path);
            if (enumData){
                enummap.set(EnumType[key], enumData);
            }
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

	loadGithubDatasets(context);


}

function loadGithubDatasets(context: vscode.ExtensionContext) {
	const globalState = context.globalState;

	// Load datasets from globalState or fallback to local datasets if necessary
	ObjectInfo[ObjectType.MECHANIC].dataset = globalState.get('mechanicsDataset') || loadLocalMechanicDataset(mechanicsDatasetPath);
	ObjectInfo[ObjectType.TARGETER].dataset = globalState.get('targetersDataset') || loadLocalMechanicDataset(targetersDatasetPath);
	ObjectInfo[ObjectType.CONDITION].dataset = globalState.get('conditionsDataset') || loadLocalMechanicDataset(conditionsDatasetPath);
	ObjectInfo[ObjectType.TRIGGER].dataset = globalState.get('triggersDataset') || loadLocalMechanicDataset(triggersDatasetPath);

	for (const key of Object.keys(EnumType) as Array<keyof typeof EnumType>) {
		EnumInfo[EnumType[key]].dataset = globalState.get(EnumInfo[EnumType[key]].path) || loadLocalEnumDataset(path.join(__dirname, '../data/', EnumInfo[EnumType[key]].path));
	}

}


export function updateDatasets() {
	updateDatasetMaps();
	updateDatasetEnums();

}

function updateDatasetMaps() {

	ObjectInfo[ObjectType.MECHANIC].datasetMap = new Map<string, Mechanic>();
	ObjectInfo[ObjectType.MECHANIC].datasetClassMap = new Map<string, Mechanic>();

	ObjectInfo[ObjectType.TARGETER].datasetMap = new Map<string, Mechanic>();
	ObjectInfo[ObjectType.TARGETER].datasetClassMap = new Map<string, Mechanic>();

	ObjectInfo[ObjectType.CONDITION].datasetMap = new Map<string, Mechanic>();
	ObjectInfo[ObjectType.CONDITION].datasetClassMap = new Map<string, Mechanic>();

	ObjectInfo[ObjectType.TRIGGER].datasetMap = new Map<string, Mechanic>();
	ObjectInfo[ObjectType.TRIGGER].datasetClassMap = new Map<string, Mechanic>();

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

function mapDataset(object: ObjectInfo) {
	for (const mechanic of object.dataset) {
		for (const name of mechanic.name) {
			object.datasetMap.set(name, mechanic);
		}
		object.datasetClassMap.set(mechanic.class.toLowerCase(), mechanic);
	}
}

function loadLocalMechanicDataset(datasetPath: string): MechanicDataset {
	try {
		return JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
	} catch (error) {
		console.error(`Error reading local dataset: ${datasetPath}`, error);
		return [];
	}
}

function loadLocalEnumDataset(datasetPath: string): EnumInfoValueDataset {
	try {
		return JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
	} catch (error) {
		console.error(`Error reading local dataset: ${datasetPath}`, error);
		return {};
	}
}

// function loadLocalDataset(datasetPath: string): any {
// 	try {
// 		return JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
// 	} catch (error) {
// 		console.error(`Error reading local dataset: ${datasetPath}`, error);
// 		return [];
// 	}
// }