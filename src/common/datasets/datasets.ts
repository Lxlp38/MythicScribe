import * as vscode from 'vscode';

import { getLogger } from '../providers/loggerProvider';
import { ScribeMechanicHandler } from './ScribeMechanic';
import { ScribeEnumHandler } from './ScribeEnum';
import { ctx } from '../../MythicScribe';
import {
    ComponentStatus,
    convertLocalPathToGitHubUrl as convertRelativePathToGitHubUrl,
    ensureComponentsExist,
    getRelativePath,
} from '../utils/uriutils';
import { ConfigProvider, finallySetEnabledPlugins } from '../providers/configProvider';
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
    edcsUri = vscode.Uri.joinPath(ctx!.globalStorageUri, 'extensionDatasetsClonedStorage/');
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
        getLogger().trace(
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
        if (ConfigProvider.registry.generic.get('datasetSource') === 'GitHub') {
            if (!shouldUpdateGithubDatasets) {
                const status = await ensureComponentsExist(this.edcsUri);
                if (status === ComponentStatus.Exists) {
                    return fetchJsonFromLocalFile<T>(this.edcsUri);
                }
                getLogger().debug(
                    'EDCS for',
                    this.edcsUri.fsPath,
                    'is empty, fetching data from GitHub'
                );
            }

            const data = await fetchJsonFromURL<T>(this.githubUri.toString());
            if (data) {
                this.updateEDCS(data);
                return data;
            }
            getLogger().debug(
                'Failed to fetch data from GitHub for',
                this.githubUri.fsPath,
                'returning local data'
            );
        }
        return fetchJsonFromLocalFile<T>(this.localUri);
    }

    private async updateEDCS(data: T[]) {
        const json = JSON.stringify(data);
        getLogger().trace('Feched data:', json);
        const status = await ensureComponentsExist(this.edcsUri);
        if (status === ComponentStatus.Error) {
            getLogger().warn(`Failed to ensure EDCS exists: ${this.edcsUri.fsPath}`);
            return;
        }
        await vscode.workspace.fs.writeFile(this.edcsUri, Buffer.from(json));
        getLogger().debug('Updated EDCS:', this.edcsUri.path);
    }

    async getModifiedTime(uri: vscode.Uri): Promise<number | null> {
        try {
            const stats = await vscode.workspace.fs.stat(uri);
            return stats.mtime;
        } catch (error) {
            getLogger().error(error);
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

async function fetchNextHash(latestCommitHash: string) {
    const nextCommitHash = await fetchLatestCommitHash();
    if (nextCommitHash && nextCommitHash !== latestCommitHash) {
        getLogger().debug('Next commit hash:', nextCommitHash);
        ctx!.globalState.update('latestCommitHash', nextCommitHash);
        getLogger().options(
            'New dataset update has been found. It will be applied the next time the datasets are loaded',
            {
                'Reload Datasets Now': {
                    type: 'command',
                    target: 'mythicscribe.loadDatasets',
                },
            }
        );
    }
}

export async function loadDatasets() {
    getLogger().debug(
        'Loading datasets from',
        ConfigProvider.registry.generic.get('datasetSource') || 'undefined'
    );

    if (ConfigProvider.registry.generic.get('datasetSource') === 'GitHub') {
        await initializeExtensionDatasetsClonedStorage();
        const latestCommitHash = ctx!.globalState.get<string>('latestCommitHash');
        const savedCommitHash = ctx!.globalState.get<string>('savedCommitHash');
        if (!savedCommitHash || latestCommitHash !== savedCommitHash) {
            getLogger().debug(
                'Commit hash mismatch, updating datasets',
                savedCommitHash?.toString() || 'undefined',
                '-->',
                latestCommitHash?.toString() || 'undefined'
            );
            shouldUpdateGithubDatasets = true;
            ctx!.globalState.update('savedCommitHash', latestCommitHash);
        } else {
            getLogger().debug('Commit hash matches, no need to update datasets');
        }
        fetchNextHash(latestCommitHash || '');
    }
    ScribeEnumHandler.loadEnumDatasets();
    await Promise.allSettled([ScribeMechanicHandler.loadMechanicDatasets(), loadCustomDatasets()]);
    ScribeMechanicHandler.finalize();
    finallySetEnabledPlugins();
    if (ConfigProvider.registry.fileParsingPolicy.get('parseOnStartup')) {
        MythicNodeHandler.scanAllDocuments();
    }
    datasetsLoadedEventEmitter.fire();
}

async function initializeExtensionDatasetsClonedStorage() {
    getLogger().debug('Initializing extension datasets cloned storage');
    await ensureComponentsExist(edcsUri);
}

export async function clearExtensionDatasetsClonedStorage() {
    getLogger().debug('Clearing extension datasets cloned storage');
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
    getLogger().debug('Fetching latest commit hash from GitHub');
    try {
        const response = await fetch(GITHUB_API_COMMITS_URL);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && typeof data[0].sha === 'string') {
            getLogger().debug('Latest commit hash fetched: ' + data[0].sha);
            return data[0].sha;
        } else {
            throw new Error('Unexpected data format');
        }
    } catch (error) {
        getLogger().error(error);
        return null;
    }
}

export async function fetchJsonFromURL<T>(url: string): Promise<T[] | undefined> {
    getLogger().debug(`Fetching JSON data from URL: ${url}`);
    try {
        const response = await fetch(url);
        if (response.ok) {
            return (await response.json()) as T[];
        } else {
            throw new Error(`Failed to fetch JSON data from URL: ${url}`);
        }
    } catch (error) {
        getLogger().error(error);
        return undefined;
    }
}

export async function fetchJsonFromLocalFile<T>(filepath: vscode.Uri): Promise<T[]> {
    getLogger().debug(`Fetching JSON data from local file: ${filepath}`);
    try {
        const fileData = await vscode.workspace.fs.readFile(filepath);
        return JSON.parse(Buffer.from(fileData).toString('utf8'));
    } catch (error) {
        getLogger().error(error, `Couldn't fetch JSON data from local file ${filepath}`);
        return [];
    }
}
