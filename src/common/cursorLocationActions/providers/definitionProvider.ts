import * as vscode from 'vscode';

import { MythicNode } from '../../mythicnodes/MythicNode';
import { CursorLocationAction } from '../cursorLocationAction';

export function definitionProvider() {
    return vscode.languages.registerDefinitionProvider('mythicscript', {
        provideDefinition(document, position): vscode.ProviderResult<vscode.LocationLink[]> {
            return CursorLocationAction.forNode(document, position, { node: definitionCallback });
        },
    });
}

function definitionCallback(
    skill: MythicNode,
    range: vscode.Range
): vscode.ProviderResult<vscode.LocationLink[]> {
    return [
        {
            originSelectionRange: range,
            targetUri: skill.document.uri,
            targetRange: skill.name.range,
            targetSelectionRange: skill.name.range,
        },
    ];
}
