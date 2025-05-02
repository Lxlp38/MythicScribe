import * as vscode from 'vscode';

import { CursorLocationAction } from '../cursorLocationAction';
import { Schema } from '../../objectInfos';
import { MythicAttribute, MythicMechanic } from '../../datasets/ScribeMechanic';

export function linksProvider(schema: Schema) {
    return vscode.languages.registerDefinitionProvider('mythicscript', {
        provideDefinition(document, position): vscode.ProviderResult<vscode.Location[]> {
            return CursorLocationAction.forSchema(
                document,
                position,
                schema,
                getDefinitionForFileElement,
                getDefinitionForAttribute,
                getDefinitionForMechanic
            );
        },
    });
}

function getDefinitionForFileElement(
    keys: string[],
    type: Schema,
    link: string | undefined
): vscode.Location[] | undefined {
    const key = keys[0];
    keys = keys.slice(1);
    const object = type[key];
    const objectLink = object.link ? object.link : link;
    if (objectLink) {
        vscode.env.openExternal(vscode.Uri.parse(objectLink));
    }
    return undefined;
}

async function getDefinitionForAttribute(
    attribute: MythicAttribute
): Promise<vscode.Location[] | undefined> {
    vscode.env.openExternal(vscode.Uri.parse(attribute.link));
    return undefined;
}

async function getDefinitionForMechanic(
    mechanic: MythicMechanic
): Promise<vscode.Location[] | undefined> {
    vscode.env.openExternal(vscode.Uri.parse(mechanic.link));
    return undefined;
}
