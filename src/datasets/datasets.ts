import * as vscode from 'vscode';
import * as config from '../utils/configutils';
import { EnumInfo, EnumDataset, EnumDetail, Mechanic, MechanicDataset, ObjectInfo, ObjectType, newEnumDetail } from '../objectInfos';
import { loadCustomDatasets } from './customDatasets';


// Define the paths to your local datasets
let mechanicsDatasetPath: vscode.Uri;
let targetersDatasetPath: vscode.Uri;
let conditionsDatasetPath: vscode.Uri;
let triggersDatasetPath: vscode.Uri;
let aitargetsDatasetPath: vscode.Uri;

let ctx: vscode.ExtensionContext;

// GitHub URL to fetch data from
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/Lxlp38/MythicScribe/master/data/';
const GITHUB_API_COMMITS_URL = 'https://api.github.com/repos/Lxlp38/MythicScribe/commits?path=data';


// Function to load datasets, check globalState, and update if necessary
export async function loadDatasets(context: vscode.ExtensionContext) {

	ctx = context;

	mechanicsDatasetPath = vscode.Uri.joinPath(context.extensionUri, 'data', 'mechanics');
	targetersDatasetPath = vscode.Uri.joinPath(context.extensionUri, 'data', 'targeters');
	conditionsDatasetPath = vscode.Uri.joinPath(context.extensionUri, 'data', 'conditions');
	triggersDatasetPath = vscode.Uri.joinPath(context.extensionUri, 'data', 'triggers');
	aitargetsDatasetPath = vscode.Uri.joinPath(context.extensionUri, 'data', 'aitargets');

	if (config.datasetSource() === 'GitHub') {
		await checkGithubDatasets(context);
	} else {
		await loadLocalDatasets();
	}

	await Promise.all(
		[
			checkForLambaEnum(ObjectInfo[ObjectType.MECHANIC].dataset),
			checkForLambaEnum(ObjectInfo[ObjectType.TARGETER].dataset),
			checkForLambaEnum(ObjectInfo[ObjectType.CONDITION].dataset),
			checkForLambaEnum(ObjectInfo[ObjectType.TRIGGER].dataset)
		]
	);

	await Promise.all([loadEnumDatasets(), loadCustomDatasets()]);

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

export async function fetchEnumDatasetFromLink(link: string): Promise<EnumDataset> {
	try {
		const response = await fetch(link);
		if (response.ok) {
			return await response.json() as EnumDataset;
		} else {
			throw new Error(`Failed to fetch enum dataset from link: ${link}`);
		}
	} catch (error) {
		console.error(error);
		return {};
	}
}

function getVersionSpecificDatasetPath(enumdetail: EnumDetail): string {
	if (enumdetail.path === null) {
		return "null";
	}
	if (enumdetail.volatile) {
		const version = config.minecraftVersion();
		return vscode.Uri.joinPath(ctx.extensionUri, 'data', 'versions', version as string, enumdetail.path).fsPath;
	}
	return vscode.Uri.joinPath(ctx.extensionUri, 'data', enumdetail.path).fsPath;
}

async function loadLocalDatasets() {
	// Load datasets from local files
	ObjectInfo[ObjectType.MECHANIC].dataset = await loadDatasetFromLocalDirectory(mechanicsDatasetPath);
	ObjectInfo[ObjectType.TARGETER].dataset = await loadDatasetFromLocalDirectory(targetersDatasetPath);
	ObjectInfo[ObjectType.CONDITION].dataset = await loadDatasetFromLocalDirectory(conditionsDatasetPath);
	ObjectInfo[ObjectType.TRIGGER].dataset = await loadDatasetFromLocalDirectory(triggersDatasetPath);
	ObjectInfo[ObjectType.AITARGET].dataset = await loadDatasetFromLocalDirectory(aitargetsDatasetPath);

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
		const aitargetsData = await loadDatasetFromGithubDirectory('aitargets');

		console.log("Fetched datasets from GitHub");

		// Check if the data was successfully fetched
		if (mechanicsData && targetersData && conditionsData) {
			// Save datasets to globalState
			console.log("Updating globalState with fetched datasets");
			globalState.update('mechanicsDataset', mechanicsData);
			globalState.update('targetersDataset', targetersData);
			globalState.update('conditionsDataset', conditionsData);
			globalState.update('triggersDataset', triggersData);
			globalState.update('aitargetsDataset', aitargetsData);


			globalState.update('latestCommitHash', latestCommitHash);
		} else {
			// Fallback to globalState or local datasets if fetch failed
			console.warn("No connection with GitHub could be enstablished. Using globalState or local datasets as a fallback");
			loadLocalDatasets();
		}
	}

	loadGithubDatasets(context);

}

async function loadGithubDatasets(context: vscode.ExtensionContext) {
	const globalState = context.globalState;

	// Load datasets from globalState or fallback to local datasets if necessary
	ObjectInfo[ObjectType.MECHANIC].dataset = globalState.get('mechanicsDataset') || await loadDatasetFromLocalDirectory(mechanicsDatasetPath);
	ObjectInfo[ObjectType.TARGETER].dataset = globalState.get('targetersDataset') || await loadDatasetFromLocalDirectory(targetersDatasetPath);
	ObjectInfo[ObjectType.CONDITION].dataset = globalState.get('conditionsDataset') || await loadDatasetFromLocalDirectory(conditionsDatasetPath);
	ObjectInfo[ObjectType.TRIGGER].dataset = globalState.get('triggersDataset') || await loadDatasetFromLocalDirectory(triggersDatasetPath);
	ObjectInfo[ObjectType.AITARGET].dataset = globalState.get('aitargetsDataset') || await loadDatasetFromLocalDirectory(aitargetsDatasetPath);
}


async function loadEnumDatasets() {
	for (const key in EnumInfo) {
		if (EnumInfo[key].path) {
			EnumInfo[key].dataset = await loadLocalEnumDataset(getVersionSpecificDatasetPath(EnumInfo[key]));
		}
	}
}

async function checkForLambaEnum(dataset: MechanicDataset) {
	for (const mechanic of dataset) {
		for (const attribute of mechanic.attributes) {
			if (attribute.enum && attribute.enum.includes(",")) {
				const values = attribute.enum.split(",");
				await addLambdaEnumDataset(attribute.enum, values);
			}
		}
	}
}
async function addLambdaEnumDataset(key: string, values: string[]) {
	const newEnum = newEnumDetail(null, false);
	newEnum.dataset = values.reduce((acc, curr) => {
		acc[curr] = { description: "" };
		return acc;
	}, {} as EnumDataset);

	EnumInfo[key.toUpperCase()] = newEnum;

	//console.log(`Added Lambda Enum Dataset: ${key}`);
}

export async function updateDatasets() {
	updateDatasetMaps();
	updateDatasetEnums();
}

async function updateDatasetMaps() {
	Promise.all([
		mapDataset(ObjectInfo[ObjectType.MECHANIC]),
		mapDataset(ObjectInfo[ObjectType.TARGETER]),
		mapDataset(ObjectInfo[ObjectType.CONDITION]),
		mapDataset(ObjectInfo[ObjectType.TRIGGER]),
		mapDataset(ObjectInfo[ObjectType.AITARGET])
	]);

	ObjectInfo[ObjectType.INLINECONDITION].dataset = ObjectInfo[ObjectType.CONDITION].dataset;
	ObjectInfo[ObjectType.INLINECONDITION].datasetMap = ObjectInfo[ObjectType.CONDITION].datasetMap;
	ObjectInfo[ObjectType.INLINECONDITION].datasetClassMap = ObjectInfo[ObjectType.CONDITION].datasetClassMap;
}

async function updateDatasetEnums() {

	for (const key in EnumInfo) {
		const list: string[] = [];
		for (const item of Object.keys(EnumInfo[key].dataset)) {
			list.push(item);
		}
		EnumInfo[key].commalist = list.join(",");
	}
}

async function mapDataset(object: ObjectInfo) {
	object.datasetMap = new Map<string, Mechanic>();
	object.datasetClassMap = new Map<string, Mechanic>();

	for (const mechanic of object.dataset) {
		for (const name of mechanic.name) {
			object.datasetMap.set(name.toLowerCase(), mechanic);
		}
		object.datasetClassMap.set(mechanic.class.toLowerCase(), mechanic);
	}
}

export async function loadLocalMechanicDataset(datasetPath: string): Promise<MechanicDataset> {
	try {
		const fileUri = vscode.Uri.parse(datasetPath);
		const fileData = await vscode.workspace.fs.readFile(fileUri);
		return JSON.parse(Buffer.from(fileData).toString('utf8'));
	} catch (error) {
		console.error(`Error reading local dataset: ${datasetPath}`, error);
		return [];
	}
}

export async function loadLocalEnumDataset(datasetPath: string): Promise<EnumDataset> {
	try {
		const fileUri = vscode.Uri.file(datasetPath);
		const fileData = await vscode.workspace.fs.readFile(fileUri);
		return JSON.parse(Buffer.from(fileData).toString('utf8'));
	} catch (error) {
		console.error(`Error reading local dataset: ${datasetPath}`, error);
		return {};
	}
}

async function loadDatasetFromLocalDirectory(directoryPath: vscode.Uri): Promise<MechanicDataset> {
	const combinedDataset: MechanicDataset = [];
	const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(directoryPath.fsPath));

	for (const [file, fileType] of files) {
		if (fileType === vscode.FileType.File && file.endsWith('.json')) {
			const fileUri = vscode.Uri.joinPath(directoryPath, file);
			const fileData = await vscode.workspace.fs.readFile(fileUri);
			const parsedData: MechanicDataset = JSON.parse(Buffer.from(fileData).toString('utf8'));

			combinedDataset.push(...parsedData);
		}
	}

	return combinedDataset;
}

async function loadDatasetFromGithubDirectory(directoryUrl: string): Promise<MechanicDataset | EnumDataset | unknown[] | null> {
	try {
		// Fetch directory contents to get a list of files
		const response = await fetch(`${GITHUB_BASE_URL}${directoryUrl}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch directory listing from ${directoryUrl}`);
		}

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
