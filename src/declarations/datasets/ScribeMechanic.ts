import * as vscode from 'vscode';

import { AbstractScribeMechanicRegistry } from '../../common/datasets/ScribeMechanic';

export function getDirectoryFiles(
    _registry: AbstractScribeMechanicRegistry
): Promise<vscode.Uri[]> {
    return Promise.resolve([]);
}
