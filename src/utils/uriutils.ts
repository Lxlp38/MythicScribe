import * as path from 'path';

import * as vscode from 'vscode';

import { ScribeLogger } from './logger';
import { GITHUB_BASE_URL } from '../datasets/datasets';

/**
 * Ensures that all directories and files in the given Uri path exist.
 * If they don't, it creates them.
 * @param uri The Uri of the directory or file.
 */
export async function ensureComponentsExist(uri: vscode.Uri): Promise<void> {
    async function fileExistancePipeline() {
        const parentDir = vscode.Uri.file(path.dirname(uri.fsPath));
        await ensureDirectoryExists(parentDir);
        await ensureFileExists(uri);
    }
    await vscode.workspace.fs.stat(uri).then(null, async (error) => {
        if (error instanceof vscode.FileSystemError) {
            const isDirectory = uri.fsPath.endsWith(path.sep);

            if (isDirectory) {
                ScribeLogger.debug('Creating directory at', uri.fsPath);
                await ensureDirectoryExists(uri);
            } else {
                ScribeLogger.debug('Creating file at', uri.fsPath);
                await fileExistancePipeline();
            }
        } else {
            ScribeLogger.error(error, 'Error while ensuring components exist');
        }
    });
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
    return path.relative(extensionRoot, localPath);
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
    const normalizedRelativePath = path.normalize(relativePath).replace(/\\/g, '/');

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
    ScribeLogger.debug(`Fetching all files in directory: ${directorypath.fsPath}`);
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
