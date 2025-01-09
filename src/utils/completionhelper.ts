import * as vscode from 'vscode';

import * as yamlutils from './yamlutils';
import { previousSymbol } from './yamlutils';
import {
    FileObjectMap,
    MechanicDataset,
    Mechanic,
    FileObject,
    FileObjectTypes,
} from '../objectInfos';
import { ScribeEnumHandler } from '../datasets/ScribeEnum';

export async function generateFileCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    type: FileObjectMap
): Promise<vscode.CompletionItem[] | undefined> {
    if (yamlutils.isEmptyLine(document, position.line)) {
        return fileCompletions(document, position, type);
    } else if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
        return getCompletionForInvocation(document, position, context, type);
    }

    return undefined;
}

export function listCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext
): string | undefined {
    let space = ' ';

    const line = document.lineAt(position.line).text;
    if (line.match(/^\s*-\s*\S+\s/gm)) {
        return undefined;
    }

    if (context.triggerCharacter === undefined) {
        const specialSymbol = yamlutils.previousSpecialSymbol(document, position);
        if (specialSymbol !== '-') {
            return undefined;
        }
    } else {
        const charBefore2 = document.getText(new vscode.Range(position.translate(0, -2), position));
        if (charBefore2 !== '- ') {
            return undefined;
        }
    }

    if (
        context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter &&
        context.triggerCharacter === ' '
    ) {
        space = '';
    }

    if (context.triggerCharacter === undefined) {
        const charBefore = document.getText(new vscode.Range(position.translate(0, -1), position));
        if (charBefore === '-') {
            space = ' ';
        } else {
            space = '';
        }
    }

    return space;
}

export function checkShouldComplete(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    keylist: string[],
    symbol: string[]
) {
    return (
        checkShouldKeyComplete(document, position, keylist) &&
        checkShouldPrefixComplete(document, position, context, symbol)
    );
}

export function checkShouldKeyComplete(
    document: vscode.TextDocument,
    position: vscode.Position,
    keylist: string[]
) {
    const keys = yamlutils.getParentKeys(document, position);
    if (!keylist.includes(keys[0])) {
        return false;
    }
    return true;
}

export function checkShouldPrefixComplete(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    symbol: string[]
): boolean {
    if (yamlutils.isAfterComment(document, position)) {
        return false;
    }

    // called via invocation
    if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
        const mypreviousSpecialSymbol = previousSymbol(document, position);
        if (symbol.includes(mypreviousSpecialSymbol)) {
            return true;
        }
        return false;
    }

    // called via trigger character
    const charBefore0 = document.getText(new vscode.Range(position.translate(0, -1), position));
    if (symbol.includes(charBefore0)) {
        return true;
    }
    return false;
}

export function addMechanicCompletions(
    target: MechanicDataset,
    completionItems: vscode.CompletionItem[]
) {
    target.forEach((item: Mechanic) => {
        item.name.forEach((name: string) => {
            const completionItem = new vscode.CompletionItem(
                name,
                vscode.CompletionItemKind.Function
            );
            completionItem.detail = `${item.description}`;
            completionItem.kind = vscode.CompletionItemKind.Function;
            completionItem.insertText = new vscode.SnippetString(name + '{$0}');
            completionItem.command = {
                command: 'editor.action.triggerSuggest',
                title: 'Re-trigger completions...',
            };
            completionItems.push(completionItem);
        });
    });
}

// Completes new lines
export function fileCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    objectmap: FileObjectMap
): vscode.CompletionItem[] | undefined {
    const keys = yamlutils.getParentKeys(document, position).reverse();

    if (keys.length === 0) {
        return undefined;
    }

    const result = fileCompletionFindNodesOnLevel(objectmap, keys.slice(1), 1);
    if (!result) {
        return undefined;
    }
    const defaultindentation = vscode.window.activeTextEditor
        ? (vscode.window.activeTextEditor.options.tabSize as number)
        : 2;
    const [keyobjects, level] = result;
    const thislineindentation = yamlutils.getIndentation(document.lineAt(position.line).text);
    const indentation = ' '.repeat((level - thislineindentation / 2) * defaultindentation);

    if (!keyobjects) {
        return undefined;
    }

    if (keyobjects.type) {
        return fileCompletionForFileObject(keyobjects as FileObject, indentation);
    } else {
        return fileCompletionForFileObjectMap(keyobjects as FileObjectMap, indentation);
    }
}

function fileCompletionFindNodesOnLevel(
    objectmap: FileObjectMap,
    keys: string[],
    level: number
): [FileObjectMap | FileObject, number] | null {
    if (keys.length === 0) {
        return [objectmap, level];
    }

    const key = keys[0];

    const selectedObject = objectmap[key];

    if (selectedObject) {
        if (selectedObject.type === FileObjectTypes.KEY && selectedObject.keys) {
            const result = fileCompletionFindNodesOnLevel(
                selectedObject.keys,
                keys.slice(1),
                level + 1
            );
            return result;
        }
        if (selectedObject.type === FileObjectTypes.KEY_LIST) {
            return [selectedObject, level + 1];
        }
        if (selectedObject.type === FileObjectTypes.LIST) {
            return [selectedObject, level];
        }
        return [objectmap, level];
    }

    return null;
}

// Completes the key itself
function fileCompletionForFileObjectMap(
    objectMap: FileObjectMap,
    indentation: string
): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    Object.entries(objectMap).forEach(([key, value]) => {
        const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
        completionItem.kind = vscode.CompletionItemKind.File;
        if (value.type === FileObjectTypes.LIST) {
            completionItem.insertText = new vscode.SnippetString(
                indentation + key + ':\n' + indentation + '- $0'
            );
        } else if (value.type === FileObjectTypes.BOOLEAN) {
            completionItem.insertText = new vscode.SnippetString(
                indentation + key + ': ${1|true,false|}$0'
            );
        } else if (value.type === FileObjectTypes.KEY) {
            completionItem.insertText = new vscode.SnippetString(
                indentation + key + ':\n' + indentation + '  $0'
            );
        } else if (value.type === FileObjectTypes.KEY_LIST) {
            completionItem.insertText = new vscode.SnippetString(
                indentation + key + ':\n' + indentation + '  $1: $2$0'
            );
        } else {
            completionItem.insertText = new vscode.SnippetString(indentation + key + ': $0');
        }

        completionItem.detail = value.description;
        completionItem.command = {
            command: 'editor.action.triggerSuggest',
            title: 'Re-trigger completions...',
        };
        completionItems.push(completionItem);
    });

    return completionItems;
}

// Completes the key's values prefix on newline
function fileCompletionForFileObject(
    object: FileObject,
    indentation: string
): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (object.type === FileObjectTypes.LIST) {
        const completionItem = new vscode.CompletionItem('-', vscode.CompletionItemKind.Snippet);
        completionItem.insertText = new vscode.SnippetString(indentation + '- $0');
        completionItem.command = {
            command: 'editor.action.triggerSuggest',
            title: 'Re-trigger completions...',
        };
        completionItems.push(completionItem);
    } else if (object.type === FileObjectTypes.KEY_LIST) {
        const completionItem = new vscode.CompletionItem(
            'New Key',
            vscode.CompletionItemKind.Snippet
        );
        completionItem.insertText = new vscode.SnippetString(indentation + '$1: $2');
        completionItem.command = {
            command: 'editor.action.triggerSuggest',
            title: 'Re-trigger completions...',
        };
        completionItems.push(completionItem);
    }

    return completionItems;
}

function getObjectInTree(keys: string[], type: FileObjectMap): FileObject | undefined {
    const key = keys[0];
    keys = keys.slice(1);
    const object = type[key];
    if (!object) {
        return undefined;
    }
    if (keys.length === 0) {
        return object;
    }
    if (object.type === FileObjectTypes.KEY && object.keys) {
        const newobject = object.keys;
        return getObjectInTree(keys, newobject);
    }
    return undefined;
}

// Completes Invocations
export async function getCompletionForInvocation(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    type: FileObjectMap
): Promise<vscode.CompletionItem[] | undefined> {
    const keys = yamlutils.getParentKeys(document, position, true).reverse();
    if (yamlutils.isKey(document, position.line)) {
        return getKeyObjectCompletion(keys.slice(1), type);
    } else if (yamlutils.isList(document, position.line)) {
        return getListObjectCompletion(keys.slice(1), type, document, position, context);
    }
    return undefined;
}

async function getKeyObjectCompletion(
    keys: string[],
    type: FileObjectMap
): Promise<vscode.CompletionItem[] | undefined> {
    const object = getObjectInTree(keys, type);
    if (!object) {
        return undefined;
    }

    if (object.type === FileObjectTypes.ENUM && object.dataset) {
        const dataset = ScribeEnumHandler.getEnum(object.dataset);
        const completionItems: vscode.CompletionItem[] = [];
        if (!dataset) {
            return undefined;
        }
        dataset.getDataset().forEach((item, value) => {
            const completionItem = new vscode.CompletionItem(
                value,
                vscode.CompletionItemKind.EnumMember
            );
            completionItem.kind = vscode.CompletionItemKind.EnumMember;
            completionItem.detail = item.description;
            completionItem.insertText = new vscode.SnippetString(value);
            completionItems.push(completionItem);
        });
        return completionItems;
    } else if (
        (object.type === FileObjectTypes.INTEGER || object.type === FileObjectTypes.FLOAT) &&
        object.values
    ) {
        const completionItems: vscode.CompletionItem[] = [];
        object.values.forEach((value) => {
            const completionItem = new vscode.CompletionItem(
                value,
                vscode.CompletionItemKind.EnumMember
            );
            completionItem.sortText = value.toString().padStart(4, '0');
            completionItem.kind = vscode.CompletionItemKind.EnumMember;
            completionItem.insertText = new vscode.SnippetString(value);
            completionItems.push(completionItem);
        });
        return completionItems;
    }
    return undefined;
}

function getListObjectCompletion(
    keys: string[],
    type: FileObjectMap,
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext
): vscode.CompletionItem[] | undefined {
    const object = getObjectInTree(keys, type);
    if (!object) {
        return undefined;
    }

    if (object.type === FileObjectTypes.LIST && object.dataset) {
        const space = listCompletion(document, position, context);
        if (space === undefined) {
            return undefined;
        }
        const dataset = ScribeEnumHandler.getEnum(object.dataset);
        const completionItems: vscode.CompletionItem[] = [];
        if (!dataset) {
            return undefined;
        }
        dataset.getDataset().forEach((item, value) => {
            const completionItem = new vscode.CompletionItem(
                value,
                vscode.CompletionItemKind.EnumMember
            );
            completionItem.kind = vscode.CompletionItemKind.EnumMember;
            completionItem.detail = item.description;
            if (object.values) {
                completionItem.insertText = new vscode.SnippetString(
                    space + value + ' ${1|' + object.values.join(',') + '|}'
                );
            } else {
                completionItem.insertText = new vscode.SnippetString(space + value);
            }
            completionItems.push(completionItem);
        });
        return completionItems;
    }
    return undefined;
}
