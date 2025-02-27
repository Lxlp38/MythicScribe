import * as vscode from 'vscode';

import { AbstractScribeMechanicRegistry } from '../../common/datasets/ScribeMechanic';
import { ScribeLogger } from '../../common/utils/logger';

export function getDirectoryFiles(registry: AbstractScribeMechanicRegistry): Promise<vscode.Uri[]> {
    ScribeLogger.warn(
        `Calling getDirectoryFiles declaration instead of actual function with arguments ${registry.type}`
    );
    return Promise.resolve([]);
}
