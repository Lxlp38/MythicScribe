import { MythicNodeHandler, MobMythicNode } from '@common/mythicnodes/MythicNode';
import { Schema, SchemaElementTypes } from '@common/objectInfos';
import { getRootKey } from '@common/utils/yamlutils';
import * as vscode from 'vscode';

export function getMobVariables(): Schema {
    const cursorPosition = vscode.window.activeTextEditor?.selection.active;
    const activeDocument = vscode.window.activeTextEditor?.document;
    if (!cursorPosition || !activeDocument) {
        return {};
    }
    const mob = getRootKey(activeDocument, cursorPosition)?.key.trim();
    if (!mob) {
        return {};
    }
    const mobNode = MythicNodeHandler.registry.mob.getNode(mob);
    if (!mobNode) {
        return {};
    }
    const variables = (mobNode as MobMythicNode).missingVariables;

    const ret: Schema = {};
    variables.forEach((value) => {
        ret[value] = {
            type: SchemaElementTypes.STRING,
        };
    });
    return ret;
}
