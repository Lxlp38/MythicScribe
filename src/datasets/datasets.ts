import * as vscode from 'vscode';

import * as logger from '../utils/logger';
import { Mechanic, MechanicDataset, ScribeMechanicHandler } from './ScribeMechanic';
import { EnumDatasetValue, ScribeEnumHandler } from './ScribeEnum';
import { ctx } from '../MythicScribe';

// GitHub URL to fetch data from
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/Lxlp38/MythicScribe/master/data/';
const GITHUB_API_COMMITS_URL = 'https://api.github.com/repos/Lxlp38/MythicScribe/commits?path=data';

export async function loadDatasets() {
    Promise.all([ScribeEnumHandler.initializeEnums(), ScribeMechanicHandler.loadDatasets()]);
}

// Function to fetch the latest commit hash from GitHub
async function fetchLatestCommitHash(): Promise<string | null> {
    logger.logDebug('Fetching latest commit hash from GitHub');
    try {
        const response = await fetch(GITHUB_API_COMMITS_URL);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && typeof data[0].sha === 'string') {
            logger.logDebug('Latest commit hash fetched: ' + data[0].sha);
            return data[0].sha;
        } else {
            throw new Error('Unexpected data format');
        }
    } catch (error) {
        logger.logError(error);
        return null;
    }
}

// Function to fetch the JSON data from GitHub
async function fetchJsonFromGithub(filename: string): Promise<MechanicDataset | unknown | null> {
    logger.logDebug(`Fetching ${filename} from GitHub`);
    try {
        const response = await fetch(`${GITHUB_BASE_URL}${filename}`);
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`Failed to fetch ${filename} from GitHub`);
        }
    } catch (error) {
        logger.logError(error);
        return null;
    }
}

export async function fetchMechanicDatasetFromLink(link: string): Promise<MechanicDataset> {
    logger.logDebug(`Fetching mechanic dataset from link: ${link}`);
    try {
        const response = await fetch(link);
        if (response.ok) {
            return (await response.json()) as MechanicDataset;
        } else {
            throw new Error(`Failed to fetch mechanic dataset from link: ${link}`);
        }
    } catch (error) {
        logger.logError(error);
        return [];
    }
}

export async function fetchEnumDatasetFromLink(
    link: string
): Promise<Map<string, EnumDatasetValue>> {
    logger.logDebug(`Fetching enum dataset from link: ${link}`);
    try {
        const response = await fetch(link);
        if (response.ok) {
            return (await response.json()) as Map<string, EnumDatasetValue>;
        } else {
            throw new Error(`Failed to fetch enum dataset from link: ${link}`);
        }
    } catch (error) {
        logger.logError(error);
        return new Map<string, EnumDatasetValue>();
    }
}

export async function loadLocalDatasets() {
    logger.logDebug('Loading local datasets');
    // Load datasets from local files
    ScribeMechanicHandler.registry.mechanic.addMechanic(
        ...(await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.mechanic))
    );
    ScribeMechanicHandler.registry.targeter.addMechanic(
        ...(await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.targeter))
    );
    ScribeMechanicHandler.registry.condition.addMechanic(
        ...(await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.condition))
    );
    ScribeMechanicHandler.registry.trigger.addMechanic(
        ...(await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.trigger))
    );
    ScribeMechanicHandler.registry.aitarget.addMechanic(
        ...(await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.aitarget))
    );
    ScribeMechanicHandler.registry.aigoal.addMechanic(
        ...(await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.aigoal))
    );
}

export async function checkGithubDatasets() {
    logger.logDebug('Checking GitHub datasets');
    const globalState = ctx.globalState;

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
        const aigoalsData = await loadDatasetFromGithubDirectory('aigoals');

        // Check if the data was successfully fetched
        if (
            mechanicsData &&
            targetersData &&
            conditionsData &&
            triggersData &&
            aitargetsData &&
            aigoalsData
        ) {
            // Save datasets to globalState
            globalState.update('mechanicsDataset', mechanicsData);
            globalState.update('targetersDataset', targetersData);
            globalState.update('conditionsDataset', conditionsData);
            globalState.update('triggersDataset', triggersData);
            globalState.update('aitargetsDataset', aitargetsData);
            globalState.update('aigoalsDataset', aigoalsData);

            globalState.update('latestCommitHash', latestCommitHash);
        } else {
            // Fallback to globalState or local datasets if fetch failed
            logger.logError(
                'No connection with GitHub could be enstablished. Using globalState or local datasets as a fallback'
            );
            loadLocalDatasets();
        }
    }

    loadGithubDatasets();
}

async function loadGithubDatasets() {
    logger.logDebug('Loading GitHub datasets');
    const globalState = ctx.globalState;

    // Load datasets from globalState or fallback to local datasets if necessary
    ScribeMechanicHandler.registry.mechanic.addMechanic(
        ...((globalState.get('mechanicsDataset') as MechanicDataset) ||
            (await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.mechanic)))
    );
    ScribeMechanicHandler.registry.targeter.addMechanic(
        ...((globalState.get('targetersDataset') as MechanicDataset) ||
            (await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.targeter)))
    );
    ScribeMechanicHandler.registry.condition.addMechanic(
        ...((globalState.get('conditionsDataset') as MechanicDataset) ||
            (await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.condition)))
    );
    ScribeMechanicHandler.registry.trigger.addMechanic(
        ...((globalState.get('triggersDataset') as MechanicDataset) ||
            (await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.trigger)))
    );
    ScribeMechanicHandler.registry.aitarget.addMechanic(
        ...((globalState.get('aitargetsDataset') as MechanicDataset) ||
            (await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.aitarget)))
    );
    ScribeMechanicHandler.registry.aigoal.addMechanic(
        ...((globalState.get('aigoalsDataset') as MechanicDataset) ||
            (await loadDatasetFromLocalDirectory(ScribeMechanicHandler.pathMap.aigoal)))
    );
}

export async function loadLocalMechanicDataset(datasetPath: string): Promise<MechanicDataset> {
    logger.logDebug(`Loading local mechanic dataset: ${datasetPath}`);
    try {
        const fileUri = vscode.Uri.parse(datasetPath);
        const fileData = await vscode.workspace.fs.readFile(fileUri);
        return JSON.parse(Buffer.from(fileData).toString('utf8'));
    } catch (error) {
        logger.logError(error, `Error reading local dataset: ${datasetPath}`);
        return [];
    }
}

export async function loadLocalEnumDataset(
    datasetPath: string
): Promise<Map<string, EnumDatasetValue>> {
    logger.logDebug(`Loading local enum dataset: ${datasetPath}`);
    try {
        const fileUri = vscode.Uri.file(datasetPath);
        const fileData = await vscode.workspace.fs.readFile(fileUri);
        return JSON.parse(Buffer.from(fileData).toString('utf8'));
    } catch (error) {
        logger.logError(error, `Error reading local dataset: ${datasetPath}`);
        return new Map<string, EnumDatasetValue>();
    }
}

async function loadDatasetFromLocalDirectory(directoryPath: vscode.Uri): Promise<MechanicDataset> {
    logger.logDebug(`Loading dataset from local directory: ${directoryPath.fsPath}`);
    const combinedDataset: MechanicDataset = [];
    const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(directoryPath.fsPath));

    for (const [file, fileType] of files) {
        if (fileType === vscode.FileType.File && file.endsWith('.json')) {
            const fileUri = vscode.Uri.joinPath(directoryPath, file);
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            const parsedData: MechanicDataset = JSON.parse(Buffer.from(fileData).toString('utf8'));

            combinedDataset.push(...parsedData);
            logger.logDebug(`Loaded ${file} from ${directoryPath.fsPath}`);
        }
    }

    return combinedDataset;
}

async function loadDatasetFromGithubDirectory(
    directoryUrl: string
): Promise<MechanicDataset | null> {
    logger.logDebug(`Loading dataset from GitHub directory: ${directoryUrl}`);
    try {
        // Fetch directory contents to get a list of files
        const response = await fetch(`${GITHUB_BASE_URL}${directoryUrl}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch directory listing from ${directoryUrl}`);
        }

        const files: { name: string }[] = (await response.json()) as {
            name: string;
        }[];
        const combinedDataset: Mechanic[] = [];

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
                        combinedDataset.push(fileData as Mechanic);
                    }
                }
            }
        }

        return combinedDataset;
    } catch (error) {
        logger.logError(error);
        return null;
    }
}
