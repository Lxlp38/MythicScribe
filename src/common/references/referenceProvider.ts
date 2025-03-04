import * as vscode from 'vscode';

import { CursorLocationAction } from '../utils/cursorLocationAction';
import { FileObjectMap } from '../objectInfos';
import { MythicAttribute, MythicMechanic } from '../datasets/ScribeMechanic';

export function referenceProvider(fileobject: FileObjectMap) {
    return vscode.languages.registerReferenceProvider('mythicscript', {
        provideReferences(document, position): vscode.ProviderResult<vscode.Location[]> {
            return CursorLocationAction(
                document,
                position,
                fileobject,
                getReferenceForFileElement,
                getReferenceForAttribute,
                getReferenceForMechanic
            );
        },
    });
}

function getReferenceForFileElement(
    keys: string[],
    type: FileObjectMap,
    link: string | undefined
): vscode.Location[] | undefined {
    const key = keys[0];
    keys = keys.slice(1);
    const object = type[key];
    const objectLink = object.link ? object.link : link;
    if (objectLink) {
        return [new vscode.Location(vscode.Uri.parse(objectLink), new vscode.Position(0, 0))];
    }
    return undefined;
}

async function getReferenceForAttribute(attribute: MythicAttribute): Promise<vscode.Location[]> {
    return [new vscode.Location(vscode.Uri.parse(attribute.link), new vscode.Position(0, 0))];
}

async function getReferenceForMechanic(mechanic: MythicMechanic): Promise<vscode.Location[]> {
    return [new vscode.Location(vscode.Uri.parse(mechanic.link), new vscode.Position(0, 0))];
}
