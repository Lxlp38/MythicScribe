import * as vscode from 'vscode';

import { MythicMechanic, MythicAttribute } from '../datasets/ScribeMechanic';
import { KeyDependantMechanicLikeHover } from './hoverprovider';
import { FileObjectMap, keyAliases } from '../objectInfos';
import { getCursorSkills, getCursorObject } from '../utils/cursorutils';
import * as yamlutils from '../utils/yamlutils';
import { MythicNode, MythicNodeHandler } from '../mythicnodes/MythicNode';
import { searchForLinkedAttribute } from '../completions/attributeCompletionProvider';
import { scriptedEnums } from '../datasets/enumSources';
import { isItemFile, isMetaskillFile, isMobFile } from '../subscriptions/SubscriptionHelper';

export function CursorLocationAction<T>(
    document: vscode.TextDocument,
    position: vscode.Position,
    fileobject: FileObjectMap,
    fileElementFunction: (
        keys: string[],
        type: FileObjectMap,
        link: string | undefined
    ) => T | undefined,
    attributeFunction: (attribute: MythicAttribute) => Promise<T | undefined>,
    mechanicFunction: (mechanic: MythicMechanic) => Promise<T | undefined>,
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

export function CursorLocationActionForNode<T>(
    document: vscode.TextDocument,
    position: vscode.Position,
    callback: (node: MythicNode, range: vscode.Range) => vscode.ProviderResult<T>
) {
    const wordRange = document.getWordRangeAtPosition(position, /[\w\-:]+/g);
    if (!wordRange) {
        return undefined;
    }
    const word = document.getText(wordRange);

    const handlers = [
        () => handleSkill(word, wordRange, callback),
        () => handleConditionAction(document, position, word, wordRange, callback),
        () => handleTemplates(document.lineAt(position.line).text, word, wordRange, callback),
        () => handleLinkedAttribute(document, position, word, wordRange, callback),
    ];

    for (const handler of handlers) {
        const result = handler();
        if (result) {
            return result;
        }
    }

    return undefined;
}

function handleSkill<T>(
    word: string,
    wordRange: vscode.Range,
    callback: (node: MythicNode, range: vscode.Range) => vscode.ProviderResult<T>
) {
    if (word.startsWith('skill:')) {
        const skillName = word.slice(6);
        const skill = MythicNodeHandler.registry.metaskills.getNode(skillName);
        if (skill) {
            return callback(skill, wordRange.with({ start: wordRange.start.translate(0, 6) }));
        }
    }
    return undefined;
}

function handleConditionAction<T>(
    document: vscode.TextDocument,
    position: vscode.Position,
    word: string,
    wordRange: vscode.Range,
    callback: (node: MythicNode, range: vscode.Range) => vscode.ProviderResult<T>
) {
    const lineText = document.lineAt(position.line).text;
    if (isMetaskillFile) {
        const castKeywords = ['cast', 'orelsecast', 'castinstead'];
        const beforeWord = lineText.slice(0, wordRange.start.character).trim().toLowerCase();
        if (castKeywords.some((keyword) => beforeWord.endsWith(keyword))) {
            const skill = MythicNodeHandler.registry.metaskills.getNode(word);
            if (skill) {
                return callback(skill, wordRange);
            }
        }
    }
    return undefined;
}

function handleTemplates<T>(
    lineText: string,
    word: string,
    wordRange: vscode.Range,
    callback: (node: MythicNode, range: vscode.Range) => vscode.ProviderResult<T>
) {
    if (lineText.match(/^\s*Template(s)?\:/)) {
        if (isMobFile) {
            const mob = MythicNodeHandler.registry.mobs.getNode(word.trim());
            if (mob) {
                return callback(mob, wordRange);
            }
        } else if (isItemFile) {
            const item = MythicNodeHandler.registry.items.getNode(word.trim());
            if (item) {
                return callback(item, wordRange);
            }
        }
    }
    return undefined;
}

function handleLinkedAttribute<T>(
    document: vscode.TextDocument,
    position: vscode.Position,
    word: string,
    wordRange: vscode.Range,
    callback: (node: MythicNode, range: vscode.Range) => vscode.ProviderResult<T>
) {
    const keys = yamlutils.getParentKeys(document, position);
    const attribute = searchForLinkedAttribute(document, position, keys);
    if (attribute?.enum) {
        let skill: MythicNode | undefined;

        switch (attribute.enum.identifier) {
            case scriptedEnums.Metaskill:
                skill = MythicNodeHandler.registry.metaskills.getNode(word);
                break;
            case scriptedEnums.Mobs:
                skill = MythicNodeHandler.registry.mobs.getNode(word);
                break;
            case scriptedEnums.Items:
                skill = MythicNodeHandler.registry.items.getNode(word);
                break;
            case scriptedEnums.Stat:
                skill = MythicNodeHandler.registry.stats.getNode(word);
                break;
            default:
                return undefined;
        }

        if (!skill) {
            return undefined;
        }
        return callback(skill, wordRange);
    }
    return undefined;
}
