import * as vscode from 'vscode';

import { AbstractScribeMechanicRegistry } from '../../common/datasets/ScribeMechanic';
import { Log } from '../../common/utils/logger';

export async function getDirectoryFiles(
    registry: AbstractScribeMechanicRegistry
): Promise<vscode.Uri[]> {
    Log.warn(
        `Calling getDirectoryFiles declaration instead of actual function with arguments ${registry.type}`
    );
    return Promise.resolve([]);
}
