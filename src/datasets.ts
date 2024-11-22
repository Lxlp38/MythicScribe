import * as vscode from 'vscode';
import * as config from './imports/utils/configutils';
import { EnumInfo, EnumDataset, EnumType, Mechanic, MechanicDataset, ObjectInfo, ObjectType } from './objectInfos';
import path from 'path';
import * as fs from 'fs';
import { loadCustomDatasets } from './customDatasets';



// Define the paths to your local datasets
const mechanicsDatasetPath = path.join(__dirname, '../data/mechanics');
const targetersDatasetPath = path.join(__dirname, '../data/targeters');
const conditionsDatasetPath = path.join(__dirname, '../data/conditions');
const triggersDatasetPath = path.join(__dirname, '../data/triggers');


// GitHub URL to fetch data from
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/Lxlp38/MythicScribe/master/data/';
const GITHUB_API_COMMITS_URL = 'https://api.github.com/repos/Lxlp38/MythicScribe/commits?path=data';


// Function to load datasets, check globalState, and update if necessary
export async function loadDatasets(context: vscode.ExtensionContext) {

	if (config.datasetSource() === 'GitHub') {
		checkGithubDatasets(context);
	} else {
		loadLocalDatasets();
	}

	loadEnumDatasets();

	loadCustomDatasets();

	updateDatasets();
	return;
}


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
async function fetchJsonFromGithub(filename: string): Promise<MechanicDataset | EnumDataset | unknown | null> {
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

export async function fetchMechanicDatasetFromLink(link: string): Promise<MechanicDataset> {
	try {
		const response = await fetch(link);
		if (response.ok) {
			return await response.json() as MechanicDataset;
		} else {
			throw new Error(`Failed to fetch mechanic dataset from link: ${link}`);
		}
	} catch (error) {
		console.error(error);
		return [];
	}
}

function getVersionSpecificDatasetPath(specificpath: string): string {
	if (specificpath.includes('/')) {
		const version = config.minecraftVersion();
		return path.join(__dirname, '../data/versions/', version as string , specificpath);
	}
	return path.join(__dirname, '../data/', specificpath);
}

function loadLocalDatasets() {
	// Load datasets from local files
	ObjectInfo[ObjectType.MECHANIC].dataset = loadDatasetFromLocalDirectory(mechanicsDatasetPath);
	ObjectInfo[ObjectType.TARGETER].dataset = loadDatasetFromLocalDirectory(targetersDatasetPath);
	ObjectInfo[ObjectType.CONDITION].dataset = loadDatasetFromLocalDirectory(conditionsDatasetPath);
	ObjectInfo[ObjectType.TRIGGER].dataset = loadDatasetFromLocalDirectory(triggersDatasetPath);

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
		const mechanicsData = await loadDatasetFromGithubDirectory('mechanics');
		const targetersData = await loadDatasetFromGithubDirectory('targeters');
		const conditionsData = await loadDatasetFromGithubDirectory('conditions');
		const triggersData = await loadDatasetFromGithubDirectory('triggers');

		console.log("Fetched datasets from GitHub");

		// Check if the data was successfully fetched
		if (mechanicsData && targetersData && conditionsData) {
			// Save datasets to globalState
			console.log("Updating globalState with fetched datasets");
			globalState.update('mechanicsDataset', mechanicsData);
			globalState.update('targetersDataset', targetersData);
			globalState.update('conditionsDataset', conditionsData);
			globalState.update('triggersDataset', triggersData);


			globalState.update('latestCommitHash', latestCommitHash);
		} else {
			// Fallback to globalState or local datasets if fetch failed
			console.warn("No connection with GitHub could be enstablished. Using globalState or local datasets as a fallback");
			loadLocalDatasets();
		}
	}

	loadGithubDatasets(context);

}

function loadGithubDatasets(context: vscode.ExtensionContext) {
	const globalState = context.globalState;

	// Load datasets from globalState or fallback to local datasets if necessary
	ObjectInfo[ObjectType.MECHANIC].dataset = globalState.get('mechanicsDataset') || loadDatasetFromLocalDirectory(mechanicsDatasetPath);
	ObjectInfo[ObjectType.TARGETER].dataset = globalState.get('targetersDataset') || loadDatasetFromLocalDirectory(targetersDatasetPath);
	ObjectInfo[ObjectType.CONDITION].dataset = globalState.get('conditionsDataset') || loadDatasetFromLocalDirectory(conditionsDatasetPath);
	ObjectInfo[ObjectType.TRIGGER].dataset = globalState.get('triggersDataset') || loadDatasetFromLocalDirectory(triggersDatasetPath);

}


function loadEnumDatasets() {
	for (const key of Object.keys(EnumType) as Array<keyof typeof EnumType>) {
		EnumInfo[EnumType[key]].dataset = loadLocalEnumDataset(getVersionSpecificDatasetPath(EnumInfo[EnumType[key]].path));
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
			object.datasetMap.set(name.toLowerCase(), mechanic);
		}
		object.datasetClassMap.set(mechanic.class.toLowerCase(), mechanic);
	}
}

export function loadLocalMechanicDataset(datasetPath: string): MechanicDataset {
	try {
		return JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
	} catch (error) {
		console.error(`Error reading local dataset: ${datasetPath}`, error);
		return [];
	}
}

function loadLocalEnumDataset(datasetPath: string): EnumDataset {
	try {
		return JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
	} catch (error) {
		console.error(`Error reading local dataset: ${datasetPath}`, error);
		return {};
	}
}

function loadDatasetFromLocalDirectory(directoryPath: string): MechanicDataset {
    const combinedDataset: MechanicDataset = [];
	const files = fs.readdirSync(directoryPath);

    files.forEach((file) => {
        const filePath = path.join(directoryPath, file);

        if (path.extname(file) === '.json') {
            const fileContents = fs.readFileSync(filePath, 'utf-8');
            const parsedData: MechanicDataset = JSON.parse(fileContents);

            combinedDataset.push(...parsedData);
        }
    });

    return combinedDataset;
}

async function loadDatasetFromGithubDirectory(directoryUrl: string): Promise<MechanicDataset | EnumDataset | unknown[] | null> {
	try {
		// Fetch directory contents to get a list of files
		const response = await fetch(`${GITHUB_BASE_URL}${directoryUrl}`);
		if (!response.ok) throw new Error(`Failed to fetch directory listing from ${directoryUrl}`);

		const files: { name: string }[] = await response.json() as { name: string }[];
		const combinedDataset: unknown[] = [];

		// Loop through each file in the directory
		for (const file of files) {
			if (file.name.endsWith('.json')) {
				const fileUrl = `${directoryUrl}/${file.name}`;
				const fileData = await fetchJsonFromGithub(fileUrl);

				// If the file data is valid, add it to the combined dataset
				if (fileData) {
					if (Array.isArray(fileData)) {
						combinedDataset.push(...fileData);
					} else {
						combinedDataset.push(fileData);
					}
				}
			}
		}

		return combinedDataset;
	} catch (error) {
		console.error(error);
		return null;
	}
}
