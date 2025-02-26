import * as vscode from 'vscode';

import { AbstractScribeMechanicRegistry } from '../../common/datasets/ScribeMechanic';
import { ctx } from '../../MythicScribe';

export async function getDirectoryFiles(
    registry: AbstractScribeMechanicRegistry
): Promise<vscode.Uri[]> {
    return registry.files.map((file) =>
        vscode.Uri.joinPath(ctx.extensionUri, 'data', registry.folder, file + '.json')
    );
}
