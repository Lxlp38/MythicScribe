import * as vscode from 'vscode';

import { MythicNode } from '../mythicnodes/MythicNode';
import { CursorLocationActionForNode } from './cursorLocationAction';

export function definitionProvider() {
    return vscode.languages.registerDefinitionProvider('mythicscript', {
        provideDefinition(document, position): vscode.ProviderResult<vscode.LocationLink[]> {
            return CursorLocationActionForNode(document, position, definitionCallback);
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
            targetRange: skill.range,
            targetSelectionRange: skill.range,
        },
    ];
}
