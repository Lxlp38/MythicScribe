import * as vscode from 'vscode';

import { MythicMechanic, MythicAttribute } from '../datasets/ScribeMechanic';
import { Schema, keyAliases, registryKey, specialAttributeEnumToRegistryKey } from '../objectInfos';
import { getCursorSkills, getCursorObject } from '../utils/cursorutils';
import * as yamlutils from '../utils/yamlutils';
import { MythicNode, MythicNodeHandler } from '../mythicnodes/MythicNode';
import { searchForLinkedAttribute } from '../completions/component/attributeCompletionProvider';
import { ActiveFileTypeInfo } from '../subscriptions/SubscriptionHelper';
import {
    fromPlaceholderNodeIdentifierToRegistryKey,
    getLastNodeFromPlaceholder,
    removeLastPlaceholderSegment,
} from '../datasets/ScribePlaceholder';
import { ConditionActions } from '../schemas/conditionActions';
import { KeyDependantMechanicLikeHover } from './providers/hoverprovider';

export namespace CursorLocationAction {
    export function forSchema<T>(
        document: vscode.TextDocument,
        position: vscode.Position,
        schema: Schema,
        fileElementFunction: (
            keys: string[],
            type: Schema,
            link: string | undefined
        ) => T | undefined,
        attributeFunction: (attribute: MythicAttribute) => Promise<T | undefined>,
        mechanicFunction: (mechanic: MythicMechanic) => Promise<T | undefined>,
        ...keydependencies: KeyDependantMechanicLikeHover[]
    ) {
        const keys = yamlutils.getParentKeys(document, position);

        if (yamlutils.isKey(document, position.line, position)) {
            const key = yamlutils.getKey(document, position.line);
            keys.reverse();
            keys.push({
                key: key,
                line: position.line,
                indent: yamlutils.getIndentation(document.lineAt(position.line).text),
            });

            return fileElementFunction(
                yamlutils.getKeyNameFromYamlKey(keys.slice(1)),
                schema,
                undefined
            );
        }

        if (keyAliases.Skills.includes(keys[0].key)) {
            const result = getCursorSkills(document, position, keys[0].line);
            if (!result) {
                return null;
            }
            if (result instanceof MythicAttribute) {
                return attributeFunction(result as MythicAttribute);
            }
            return mechanicFunction(result);
        }
        for (const keydependency of keydependencies) {
            if (keydependency.keys.includes(keys[0].key)) {
                const result = getCursorObject(
                    keydependency.registry,
                    document,
                    position,
                    keys[0].line
                );
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

    export function forNode<T>(
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
            () => handlePlaceholder(document, position, word, wordRange, callback),
        ];

        for (const handler of handlers) {
            const result = handler();
            if (result) {
                return result;
            }
        }

        return undefined;
    }
}
function handleSkill<T>(
    word: string,
    wordRange: vscode.Range,
    callback: (node: MythicNode, range: vscode.Range) => vscode.ProviderResult<T>
) {
    if (word.startsWith('skill:')) {
        const skillName = word.slice(6);
        const skill = MythicNodeHandler.registry.metaskill.getNode(skillName);
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
    if (!ActiveFileTypeInfo.metaskill) {
        return undefined;
    }
    const lineText = document.lineAt(position.line).text;
    const beforeWord = lineText.slice(0, wordRange.start.character).trim().toLowerCase();
    if (ConditionActions.metaskillActions.some((keyword) => beforeWord.endsWith(keyword))) {
        const skill = MythicNodeHandler.registry.metaskill.getNode(word);
        if (skill) {
            return callback(skill, wordRange);
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
        const template = ActiveFileTypeInfo.mob
            ? MythicNodeHandler.registry.mob.getNode(word.trim())
            : ActiveFileTypeInfo.item
              ? MythicNodeHandler.registry.item.getNode(word.trim())
              : undefined;
        if (template) {
            return callback(template, wordRange);
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
    if (!attribute?.enum) {
        return undefined;
    }

    if (!registryKey.includes(attribute.enum.identifier as registryKey)) {
        if (attribute.enum.identifier.toLowerCase() in specialAttributeEnumToRegistryKey) {
            const registryKey = specialAttributeEnumToRegistryKey[attribute.enum.identifier];
            const node = MythicNodeHandler.registry[registryKey].getNode(word);
            if (node) {
                return callback(node, wordRange);
            }
        }
        return undefined;
    }

    const node = MythicNodeHandler.registry[attribute.enum.identifier as registryKey].getNode(word);

    if (!node) {
        return undefined;
    }

    return callback(node, wordRange);
}

function handlePlaceholder<T>(
    document: vscode.TextDocument,
    position: vscode.Position,
    word: string,
    wordRange: vscode.Range,
    callback: (node: MythicNode, range: vscode.Range) => vscode.ProviderResult<T>
) {
    const placeholderWordRange = document.getWordRangeAtPosition(position, /(?<=<)[\w\-_.]+(?=>)/g);
    if (!placeholderWordRange) {
        return undefined;
    }
    const previusPlaceholderTextBeforePosition = placeholderWordRange.with({
        end: position,
    });
    const placeholderText = document.getText(previusPlaceholderTextBeforePosition);
    const placeholderNode = getLastNodeFromPlaceholder(
        removeLastPlaceholderSegment(placeholderText) + '.' + word
    );
    if (!placeholderNode) {
        return undefined;
    }
    const registryKey = fromPlaceholderNodeIdentifierToRegistryKey(placeholderNode);
    if (!registryKey) {
        return undefined;
    }
    const registry = MythicNodeHandler.getRegistry(registryKey);
    if (!registry) {
        return undefined;
    }
    const node = registry.getNode(word);
    if (!node) {
        return undefined;
    }
    return callback(node, wordRange);
}
