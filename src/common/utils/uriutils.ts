import * as path from 'path';

import * as vscode from 'vscode';

import { Log } from './logger';
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
    async function fileExistancePipeline() {
        const parentDir = vscode.Uri.joinPath(uri, '..');
        await ensureDirectoryExists(parentDir);
        await ensureFileExists(uri);
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
                const isDirectory = uri.fsPath.endsWith(path.sep);

                if (isDirectory) {
                    Log.debug('Creating directory at', uri.fsPath);
                    await ensureDirectoryExists(uri);
                } else {
                    Log.debug('Creating file at', uri.fsPath);
                    await fileExistancePipeline();
                }
                return ComponentStatus.Created;
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
async function ensureDirectoryExists(uri: vscode.Uri): Promise<void> {
    try {
        await vscode.workspace.fs.stat(uri);
    } catch (error) {
        if (error instanceof vscode.FileSystemError) {
            await vscode.workspace.fs.createDirectory(uri);
        } else {
            throw error;
        }
    }
}

/**
 * Ensures that a file exists. If it doesn't, it creates it.
 * @param uri The Uri of the file.
 */
async function ensureFileExists(uri: vscode.Uri): Promise<void> {
    try {
        await vscode.workspace.fs.stat(uri);
    } catch (error) {
        if (error instanceof vscode.FileSystemError) {
            await vscode.workspace.fs.writeFile(uri, new Uint8Array());
        } else {
            throw error;
        }
    }
}

const extensionRoot = vscode.extensions.getExtension('lxlp.mythicscribe')!.extensionPath;

/**
 * Returns the relative path from the extension root to the given local path.
 *
 * @param localPath - The local file path for which to determine the relative path.
 * @returns The relative path from the extension root to the given local path.
 */
export function getRelativePath(localPath: string): string {
    const relativePath = localPath.replace(extensionRoot, '');
    return relativePath;
}

/**
 * Converts a local file path to a GitHub raw content URL.
 *
 * @param localPath - The local file path to be converted.
 * @param relative - A boolean indicating whether the provided local path is already relative.
 *                   If false, the function will convert the local path to a relative path.
 *                   Defaults to false.
 * @returns The GitHub raw content URL corresponding to the provided local file path.
 */
export function convertLocalPathToGitHubUrl(localPath: string, relative: boolean = false): string {
    // Determine the relative path of the file
    const relativePath = relative ? localPath : getRelativePath(localPath);

    // Normalize the relative path to ensure consistent slashes
    let normalizedRelativePath = path.normalize(relativePath).replace(/\\/g, '/');
    if (normalizedRelativePath.startsWith('/') || normalizedRelativePath.startsWith('\\')) {
        normalizedRelativePath = normalizedRelativePath.substring(1);
    }

    // Construct the GitHub raw content URL
    const githubUrl = `${GITHUB_BASE_URL}${normalizedRelativePath}`;

    return githubUrl;
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
 * console.log(files); // Outputs an array of file paths
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

export function logFileTree(uri: vscode.Uri) {
    vscode.workspace.fs.readDirectory(uri).then((files) => {
        files.forEach((file) => {
            const [name, type] = file;
            Log.debug(name, type.toString());
        });
        return;
    });
}
