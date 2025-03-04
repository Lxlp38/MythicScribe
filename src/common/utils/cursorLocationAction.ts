import * as vscode from 'vscode';

import { MythicMechanic, MythicAttribute } from '../datasets/ScribeMechanic';
import { KeyDependantMechanicLikeHover } from '../hovers/hoverprovider';
import { FileObjectMap, keyAliases } from '../objectInfos';
import { getCursorSkills, getCursorObject } from './cursorutils';
import * as yamlutils from './yamlutils';

export function CursorLocationAction<T>(
    document: vscode.TextDocument,
    position: vscode.Position,
    fileobject: FileObjectMap,
    fileElementFunction: (
        keys: string[],
        type: FileObjectMap,
        link: string | undefined
    ) => T | undefined,
    attributeFunction: (attribute: MythicAttribute) => Promise<T>,
    mechanicFunction: (mechanic: MythicMechanic) => Promise<T>,
    ...keydependencies: KeyDependantMechanicLikeHover[]
) {
    const keys = yamlutils.getParentKeys(document, position);

    if (yamlutils.isKey(document, position.line)) {
        const key = yamlutils.getKey(document, position.line);
        keys.reverse();
        keys.push([key, position.line]);

        return fileElementFunction(
            yamlutils.getKeyNameFromYamlKey(keys.slice(1)),
            fileobject,
            undefined
        );
    }

    if (keyAliases.Skills.includes(keys[0][0])) {
        const result = getCursorSkills(document, position, keys[0][1]);
        if (!result) {
            return null;
        }
        if (result instanceof MythicAttribute) {
            return attributeFunction(result as MythicAttribute);
        }
        return mechanicFunction(result);
    }
    for (const keydependency of keydependencies) {
        if (keydependency.keys.includes(keys[0][0])) {
            const result = getCursorObject(keydependency.registry, document, position, keys[0][1]);
            if (!result) {
                return undefined;
            }
            const obj = result;

            if (!obj) {
                return undefined;
            }
            if (obj instanceof MythicAttribute) {
                return attributeFunction(obj as MythicAttribute);
            }

            return mechanicFunction(obj);
        }
    }
    return null;
}
