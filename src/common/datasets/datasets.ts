import * as vscode from 'vscode';

import { ScribeLogger } from '../utils/logger';
import { ScribeMechanicHandler } from './ScribeMechanic';
import { ScribeEnumHandler } from './ScribeEnum';
import { ctx } from '../../MythicScribe';
import {
    convertLocalPathToGitHubUrl,
    ensureComponentsExist,
    getRelativePath,
    isFileEmpty,
} from '../utils/uriutils';
import { datasetSource } from '../utils/configutils';

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

export class ScribeCloneableFile<T> {
    relativePath: string;
    localUri: vscode.Uri;
    githubUri: vscode.Uri;
    edcsUri: vscode.Uri;

    constructor(uri: vscode.Uri) {
        this.relativePath = getRelativePath(uri.fsPath);
        this.localUri = uri;
        this.githubUri = vscode.Uri.parse(convertLocalPathToGitHubUrl(this.relativePath, true));
        this.edcsUri = vscode.Uri.joinPath(edcsUri, this.relativePath);
        ScribeLogger.trace(
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
                await ensureComponentsExist(this.edcsUri);
                const empty = await isFileEmpty(this.edcsUri);
                if (!empty) {
                    return fetchJsonFromLocalFile<T>(this.edcsUri);
                }
                ScribeLogger.debug(
                    'EDCS for',
                    this.edcsUri.fsPath,
                    'is empty, fetching data from GitHub'
                );
            }

            const data = await fetchJsonFromURL<T>(this.githubUri.toString());
            if (data) {
                ScribeLogger.debug('Feched data:', data.length.toString());
                this.updateEDCS(data);
                return data;
            }
            ScribeLogger.debug(
                'Failed to fetch data from GitHub for',
                this.githubUri.fsPath,
                'returning local data'
            );
        }
        return fetchJsonFromLocalFile<T>(this.localUri);
    }

    private async updateEDCS(data: T[]) {
        await ensureComponentsExist(this.edcsUri);
        await vscode.workspace.fs.writeFile(this.edcsUri, Buffer.from(JSON.stringify(data)));
        ScribeLogger.debug('Updated EDCS:', this.edcsUri.fsPath);
    }

    async getModifiedTime(uri: vscode.Uri): Promise<number | null> {
        try {
            const stats = await vscode.workspace.fs.stat(uri);
            return stats.mtime;
        } catch (error) {
            ScribeLogger.error(error);
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
    ScribeLogger.debug('Loading datasets from', datasetSource() || 'undefined');

    if (datasetSource() === 'GitHub') {
        const latestCommitHash = await fetchLatestCommitHash();
        const savedCommitHash = ctx.globalState.get<string>('latestCommitHash');
        if (!savedCommitHash || latestCommitHash !== savedCommitHash) {
            ScribeLogger.debug(
                'Commit hash mismatch, updating datasets',
                savedCommitHash?.toString() || 'undefined',
                '-->',
                latestCommitHash?.toString() || 'undefined'
            );
            shouldUpdateGithubDatasets = true;
            ctx.globalState.update('latestCommitHash', latestCommitHash);
        } else {
            ScribeLogger.debug('Commit hash matches, no need to update datasets');
        }
        await initializeExtensionDatasetsClonedStorage();
    }
    ScribeEnumHandler.initializeEnums();
    await ScribeMechanicHandler.loadDatasets();
}

async function initializeExtensionDatasetsClonedStorage() {
    ScribeLogger.debug('Initializing extension datasets cloned storage');
    await ensureComponentsExist(edcsUri);
}

export async function clearExtensionDatasetsClonedStorage() {
    ScribeLogger.debug('Clearing extension datasets cloned storage');
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
    ScribeLogger.debug('Fetching latest commit hash from GitHub');
    try {
        const response = await fetch(GITHUB_API_COMMITS_URL);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && typeof data[0].sha === 'string') {
            ScribeLogger.debug('Latest commit hash fetched: ' + data[0].sha);
            return data[0].sha;
        } else {
            throw new Error('Unexpected data format');
        }
    } catch (error) {
        ScribeLogger.error(error);
        return null;
    }
}

export async function fetchJsonFromURL<T>(url: string): Promise<T[]> {
    ScribeLogger.debug(`Fetching JSON data from URL: ${url}`);
    try {
        const response = await fetch(url);
        if (response.ok) {
            return (await response.json()) as T[];
        } else {
            throw new Error(`Failed to fetch JSON data from URL: ${url}`);
        }
    } catch (error) {
        ScribeLogger.error(error);
        return [];
    }
}

export async function fetchJsonFromLocalFile<T>(filepath: vscode.Uri): Promise<T[]> {
    ScribeLogger.debug(`Fetching JSON data from local file: ${filepath}`);
    try {
        const fileData = await vscode.workspace.fs.readFile(filepath);
        return JSON.parse(Buffer.from(fileData).toString('utf8'));
    } catch (error) {
        ScribeLogger.error(error, `Couldn't fetch JSON data from local file ${filepath}`);
        return [];
    }
}
