import * as path from 'path';

import * as vscode from 'vscode';

import Log from './logger';
import { GITHUB_BASE_URL } from '../datasets/datasets';

export enum ComponentStatus {
    Exists,
    Empty,
    Created,
    Error,
}

/**
 * Ensures that all directories and files in the given Uri path exist.
 * If they don't, it creates them.
 * @param uri The Uri of the directory or file.
 */
export async function ensureComponentsExist(uri: vscode.Uri): Promise<ComponentStatus> {
    async function fileExistancePipeline(uri: vscode.Uri) {
        const parentDir = vscode.Uri.joinPath(uri, '..');
        const dirStatus = await ensureDirectoryExists(parentDir);
        if (dirStatus === ComponentStatus.Error) {
            return ComponentStatus.Error;
        }
        const fileStatus = await ensureFileExists(uri);
        return fileStatus;
    }
    return await vscode.workspace.fs.stat(uri).then(
        (stat) => {
            if (stat.size === 0) {
                return ComponentStatus.Empty;
            }
            return ComponentStatus.Exists;
        },
        async (error) => {
            if (error instanceof vscode.FileSystemError) {
                const isDir = isDirectory(uri);

                if (isDir) {
                    Log.debug('Creating directory at', uri.fsPath);
                    return await ensureDirectoryExists(uri);
                }
                Log.debug('Creating file at', uri.fsPath);
                return await fileExistancePipeline(uri);
            } else {
                Log.error(error, 'Error while ensuring components exist');
                return ComponentStatus.Error;
            }
        }
    );
}

/**
 * Ensures that a directory exists. If it doesn't, it creates it.
 * @param uri The Uri of the directory.
 */
async function ensureDirectoryExists(uri: vscode.Uri): Promise<ComponentStatus> {
    try {
        await vscode.workspace.fs.stat(uri);
        return ComponentStatus.Exists;
    } catch (error) {
        if (error instanceof vscode.FileSystemError) {
            try {
                await vscode.workspace.fs.createDirectory(uri);
                return ComponentStatus.Created;
            } catch (error) {
                Log.error(error, `Error while creating directory at ${uri.fsPath}`);
                return ComponentStatus.Error;
            }
        } else {
            Log.error(error, `Error while ensuring directory ${uri.fsPath} exists`);
            return ComponentStatus.Error;
        }
    }
}

/**
 * Ensures that a file exists. If it doesn't, it creates it.
 * @param uri The Uri of the file.
 */
async function ensureFileExists(uri: vscode.Uri): Promise<ComponentStatus> {
    try {
        await vscode.workspace.fs.stat(uri);
        return ComponentStatus.Exists;
    } catch (error) {
        if (error instanceof vscode.FileSystemError) {
            try {
                await vscode.workspace.fs.writeFile(uri, new Uint8Array());
                return ComponentStatus.Created;
            } catch (error) {
                Log.error(error, `Error while creating file at ${uri.fsPath}`);
                return ComponentStatus.Error;
            }
        } else {
            Log.error(error, `Error while ensuring file ${uri.fsPath} exists`);
            return ComponentStatus.Error;
        }
    }
}

const extensionRoot = vscode.extensions.getExtension('lxlp.mythicscribe')!.extensionUri.path;

/**
 * Returns the relative path from the extension root to the given local path.
 *
 * @param localPath - The local file path for which to determine the relative path.
 * @returns The relative path from the extension root to the given local path.
 */
export function getRelativePath(localPath: vscode.Uri): string {
    const relativePath = localPath.path.replace(extensionRoot, '');
    return relativePath;
}

/**
 * Converts a local file path to a GitHub raw content URL.
 *
 * This function takes a relative file path and constructs a URL that points to the raw content
 * of the file on GitHub. It ensures that the slashes in the path are consistent and constructs
 * the URL using a predefined GitHub base URL.
 *
 * @param relativePath - The relative path of the file to be converted.
 * @returns The GitHub raw content URL corresponding to the given relative path.
 */
export function convertLocalPathToGitHubUrl(relativePath: string): string {
    // Construct the GitHub raw content URL
    return `${GITHUB_BASE_URL}${relativePath}`;
}

/**
 * Fetches all files in the specified directory.
 *
 * @param directorypath - The URI of the directory to fetch files from.
 * @returns A promise that resolves to an array of file paths as strings.
 *
 * @example
 * ```typescript
 * const directoryUri = vscode.Uri.file('/path/to/directory');
 * const files = await fetchAllFilesInDirectory(directoryUri);
 * ```
 */
export async function fetchAllFilesInDirectory(directorypath: vscode.Uri): Promise<vscode.Uri[]> {
    Log.debug(`Fetching all files in directory: ${directorypath.fsPath}`);
    const files = (await vscode.workspace.fs.readDirectory(directorypath))
        .filter((file) => file[1] === vscode.FileType.File)
        .map((file) => vscode.Uri.joinPath(directorypath, file[0]));
    return files;
}

export async function isFileEmpty(uri: vscode.Uri) {
    return vscode.workspace.fs.stat(uri).then((stat) => {
        return stat.size === 0;
    });
}

export function isDirectory(uri: vscode.Uri) {
    return uri.fsPath.endsWith(path.sep);
}

export async function openDocumentTactfully(uri: vscode.Uri) {
    try {
        return await vscode.workspace.openTextDocument(uri);
    } catch {
        return undefined;
    }
}
