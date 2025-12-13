import { ConfigProvider } from '@common/providers/configProvider';
import { getLogger } from '@common/providers/loggerProvider';
import {
    getRelativePath,
    convertLocalPathToGitHubUrl as convertRelativePathToGitHubUrl,
    ensureComponentsExist,
    ComponentStatus,
    fetchJsonFromLocalFile,
    fetchJsonFromURL,
} from '@common/utils/uriutils';
import * as vscode from 'vscode';
import { GITHUB_API_COMMITS_BASE_URL } from '@common/constants';
import { stateControlBooleanProvider } from '@common/stateDataProvider';

import { edcsUri } from './edcsUri';

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
            const doUpdateGithubDataset = stateControlBooleanProvider
                .register('doUpdateGithubDataset')
                .then((value) => value)
                .catch(() => false);
            getLogger().trace(
                `Checking if we should update GitHub datasets for ${this.githubUri.toString()}: ${(await doUpdateGithubDataset) ? 'Yes' : 'No'}`
            );
            if (!(await doUpdateGithubDataset)) {
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
                await this.updateEDCS(data);
                return data;
            }
            getLogger().debug(
                'Failed to fetch data from GitHub for',
                this.githubUri.toString(),
                'returning local data'
            );
        }
        return fetchJsonFromLocalFile<T>(this.localUri);
    }

    private async updateEDCS(data: T[]) {
        const json = JSON.stringify(data);
        getLogger().trace('Fetched data:', json);
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
        try {
            const response = await fetch(GITHUB_API_COMMITS_BASE_URL + this.relativePath);
            if (!response.ok) {
                getLogger().error(
                    `Failed to fetch commit time: ${response.status} ${response.statusText}`
                );
                return null;
            }
            const data = await response.json();
            if (
                Array.isArray(data) &&
                data.length > 0 &&
                data[0].commit?.author?.date &&
                typeof data[0].commit.author.date === 'string'
            ) {
                return new Date(data[0].commit.author.date).getTime();
            }
        } catch (error) {
            getLogger().error('Error fetching commit time:', String(error));
        }
        return null;
    }
}
