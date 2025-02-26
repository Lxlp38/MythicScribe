import * as vscode from 'vscode';

import { AbstractScribeMechanicRegistry } from '../../common/datasets/ScribeMechanic';
import { fetchAllFilesInDirectory } from '../../common/utils/uriutils';

export async function getDirectoryFiles(
    registry: AbstractScribeMechanicRegistry
): Promise<vscode.Uri[]> {
    return await fetchAllFilesInDirectory(vscode.Uri.parse(registry.localPath));
}
