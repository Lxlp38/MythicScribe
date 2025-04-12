import * as vscode from 'vscode';

import Log from '../utils/logger';
import { ScribeMechanicHandler } from './ScribeMechanic';
import { ScribeEnumHandler } from './ScribeEnum';
import { ctx } from '../../MythicScribe';
import {
    ComponentStatus,
    convertLocalPathToGitHubUrl as convertRelativePathToGitHubUrl,
    ensureComponentsExist,
    getRelativePath,
} from '../utils/uriutils';
import {
    datasetSource,
    finallySetEnabledPlugins,
    getFileParserPolicyConfig,
} from '../utils/configutils';
import { loadCustomDatasets } from './customDatasets';
import { MythicNodeHandler } from '../mythicnodes/MythicNode';

// GitHub URL to fetch data from
export const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/Lxlp38/MythicScribe/master/';
const GITHUB_API_COMMITS_BASE_URL =
    'https://api.github.com/repos/Lxlp38/MythicScribe/commits?path=';
const GITHUB_API_COMMITS_URL = 'https://api.github.com/repos/Lxlp38/MythicScribe/commits?path=data';

let shouldUpdateGithubDatasets = false;

let edcsUri: vscode.Uri;
export function setEdcsUri() {
    edcsUri = vscode.Uri.joinPath(ctx.globalStorageUri, 'extensionDatasetsClonedStorage/');
}

const datasetsLoadedEventEmitter = new vscode.EventEmitter<void>();
export const onDatasetsLoaded = datasetsLoadedEventEmitter.event;

export class ScribeCloneableFile<T> {
    relativePath: string;
    localUri: vscode.Uri;
    githubUri: vscode.Uri;
    edcsUri: vscode.Uri;

    constructor(uri: vscode.Uri) {
        this.relativePath = getRelativePath(uri);
        this.localUri = uri;
        this.githubUri = vscode.Uri.parse(convertRelativePathToGitHubUrl(this.relativePath));
        this.edcsUri = vscode.Uri.parse(vscode.Uri.joinPath(edcsUri, this.relativePath).toString());
        Log.trace(
            'ScribeCloneableFile',
            JSON.stringify({
                relativePath: this.relativePath,
                localUri: this.localUri.fsPath,
                githubUri: this.githubUri.toString(),
                edcsUri: this.edcsUri.fsPath,
            })
        );
    }

    async get(): Promise<T[]> {
        if (datasetSource() === 'GitHub') {
            if (!shouldUpdateGithubDatasets) {
                const status = await ensureComponentsExist(this.edcsUri);
                if (status === ComponentStatus.Exists) {
                    return fetchJsonFromLocalFile<T>(this.edcsUri);
                }
                Log.debug('EDCS for', this.edcsUri.fsPath, 'is empty, fetching data from GitHub');
            }

            const data = await fetchJsonFromURL<T>(this.githubUri.toString());
            if (data) {
                this.updateEDCS(data);
                return data;
            }
            Log.debug(
                'Failed to fetch data from GitHub for',
                this.githubUri.fsPath,
                'returning local data'
            );
        }
        return fetchJsonFromLocalFile<T>(this.localUri);
    }

    private async updateEDCS(data: T[]) {
        const json = JSON.stringify(data);
        Log.trace('Feched data:', json);
        const status = await ensureComponentsExist(this.edcsUri);
        if (status === ComponentStatus.Error) {
            Log.warn(`Failed to ensure EDCS exists: ${this.edcsUri.fsPath}`);
            return;
        }
        await vscode.workspace.fs.writeFile(this.edcsUri, Buffer.from(json));
        Log.debug('Updated EDCS:', this.edcsUri.path);
    }

    async getModifiedTime(uri: vscode.Uri): Promise<number | null> {
        try {
            const stats = await vscode.workspace.fs.stat(uri);
            return stats.mtime;
        } catch (error) {
            Log.error(error);
            return null;
        }
    }

    async getCommitTime(): Promise<number | null> {
        const response = await fetch(GITHUB_API_COMMITS_BASE_URL + this.relativePath);
        const data = await response.json();
        if (
            Array.isArray(data) &&
            data.length > 0 &&
            typeof data[0].commit.author.date === 'string'
        ) {
            return new Date(data[0].commit.author.date).getTime();
        }
        return null;
    }
}

export async function loadDatasets() {
    Log.debug('Loading datasets from', datasetSource() || 'undefined');

    if (datasetSource() === 'GitHub') {
        await initializeExtensionDatasetsClonedStorage();
        const latestCommitHash = await fetchLatestCommitHash();
        const savedCommitHash = ctx.globalState.get<string>('latestCommitHash');
        if (!savedCommitHash || latestCommitHash !== savedCommitHash) {
            Log.debug(
                'Commit hash mismatch, updating datasets',
                savedCommitHash?.toString() || 'undefined',
                '-->',
                latestCommitHash?.toString() || 'undefined'
            );
            shouldUpdateGithubDatasets = true;
            ctx.globalState.update('latestCommitHash', latestCommitHash);
        } else {
            Log.debug('Commit hash matches, no need to update datasets');
        }
    }
    ScribeEnumHandler.loadEnumDatasets();
    await Promise.allSettled([ScribeMechanicHandler.loadMechanicDatasets(), loadCustomDatasets()]);
    ScribeMechanicHandler.finalize();
    finallySetEnabledPlugins();
    if (getFileParserPolicyConfig('parseOnStartup')) {
        MythicNodeHandler.scanAllDocuments();
    }
    datasetsLoadedEventEmitter.fire();
}

async function initializeExtensionDatasetsClonedStorage() {
    Log.debug('Initializing extension datasets cloned storage');
    await ensureComponentsExist(edcsUri);
}

export async function clearExtensionDatasetsClonedStorage() {
    Log.debug('Clearing extension datasets cloned storage');
    const exists = await vscode.workspace.fs.stat(edcsUri).then(
        () => true,
        () => false
    );
    if (exists) {
        await vscode.workspace.fs.delete(edcsUri, { recursive: true });
    }
    await initializeExtensionDatasetsClonedStorage();
}

// Function to fetch the latest commit hash from GitHub
async function fetchLatestCommitHash(): Promise<string | null> {
    Log.debug('Fetching latest commit hash from GitHub');
    try {
        const response = await fetch(GITHUB_API_COMMITS_URL);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && typeof data[0].sha === 'string') {
            Log.debug('Latest commit hash fetched: ' + data[0].sha);
            return data[0].sha;
        } else {
            throw new Error('Unexpected data format');
        }
    } catch (error) {
        Log.error(error);
        return null;
    }
}

export async function fetchJsonFromURL<T>(url: string): Promise<T[]> {
    Log.debug(`Fetching JSON data from URL: ${url}`);
    try {
        const response = await fetch(url);
        if (response.ok) {
            return (await response.json()) as T[];
        } else {
            throw new Error(`Failed to fetch JSON data from URL: ${url}`);
        }
    } catch (error) {
        Log.error(error);
        return [];
    }
}

export async function fetchJsonFromLocalFile<T>(filepath: vscode.Uri): Promise<T[]> {
    Log.debug(`Fetching JSON data from local file: ${filepath}`);
    try {
        const fileData = await vscode.workspace.fs.readFile(filepath);
        return JSON.parse(Buffer.from(fileData).toString('utf8'));
    } catch (error) {
        Log.error(error, `Couldn't fetch JSON data from local file ${filepath}`);
        return [];
    }
}
