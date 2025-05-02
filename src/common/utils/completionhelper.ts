import * as vscode from 'vscode';

import * as yamlutils from './yamlutils';
import { previousSymbol } from './yamlutils';
import {
    Schema,
    SchemaElement,
    SchemaElementTypes,
    SchemaElementSpecialKeys,
    WildKeySchemaElement,
} from '../objectInfos';
import { MythicMechanic } from '../datasets/ScribeMechanic';
import { EnumDatasetValue, ScribeEnumHandler } from '../datasets/ScribeEnum';
import { getSchemaElementInTree } from './schemautils';

export const retriggerCompletionsCommand: vscode.Command = {
    command: 'editor.action.triggerSuggest',
    title: 'Re-trigger completions...',
};

// Generates completions for normal mythic schemas
export async function generateFileCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    type: Schema
): Promise<vscode.CompletionItem[] | undefined> {
    if (yamlutils.isEmptyLine(document, position.line)) {
        return fileCompletions(document, position, type);
    } else if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
        return getCompletionForInvocation(document, position, context, type);
    }

    return undefined;
}

/**
 * Determines the appropriate space character to be used for list completion in a YAML document.
 *
 * @param document - The text document in which the completion is being triggered.
 * @param position - The position in the document where the completion is being triggered.
 * @param context - The context in which the completion is being triggered.
 * @returns A string containing a space character if appropriate, or `undefined` if no completion should be provided.
 */
export function getListCompletionNeededSpaces(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext
): string | undefined {
    const line = document.lineAt(position.line).text;
    if (line.match(/^\s*-\s*\S+\s/gm)) {
        return undefined;
    }

    if (context.triggerCharacter === undefined) {
        const specialSymbol = previousSymbol(
            yamlutils.PreviousSymbolRegexes.nonspace,
            document,
            position
        );
        if (specialSymbol !== '-') {
            return undefined;
        }
        const charBefore = document.getText(new vscode.Range(position.translate(0, -1), position));
        if (charBefore === '-') {
            return ' ';
        } else {
            return '';
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
        return '';
    }

    return ' ';
}

export function checkShouldComplete(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    keylist: string[],
    symbol: string[]
) {
    return (
        !yamlutils.isAfterComment(document, position) &&
        checkShouldKeyCompleteExec(document, position, keylist) &&
        checkShouldPrefixCompleteExec(document, position, context, symbol)
    );
}

export function checkShouldKeyComplete(
    document: vscode.TextDocument,
    position: vscode.Position,
    keylist: string[]
) {
    if (yamlutils.isAfterComment(document, position)) {
        return false;
    }
    return checkShouldKeyCompleteExec(document, position, keylist);
}
function checkShouldKeyCompleteExec(
    document: vscode.TextDocument,
    position: vscode.Position,
    keylist: string[]
) {
    const keys = yamlutils.getParentKeys(document, position);
    if (!keylist.includes(keys[0].key)) {
        return false;
    }
    return true;
}

export function checkShouldPrefixComplete(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    symbol: string[],
    depth = 0
) {
    if (yamlutils.isAfterComment(document, position)) {
        return false;
    }
    return checkShouldPrefixCompleteExec(document, position, context, symbol, depth);
}
function checkShouldPrefixCompleteExec(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    symbol: string[],
    depth = 0
): boolean {
    // called via invocation
    if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
        const mypreviousSpecialSymbol = previousSymbol(
            yamlutils.PreviousSymbolRegexes.default,
            document,
            position,
            depth
        );
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
    target: MythicMechanic[],
    completionItems: vscode.CompletionItem[],
    defaultExtend?: string
) {
    target.forEach((item: MythicMechanic) => {
        item.name.forEach((name: string) => {
            const completionItem = new vscode.CompletionItem(
                name,
                vscode.CompletionItemKind.Function
            );
            completionItem.detail = `${item.description}`;
            completionItem.kind = vscode.CompletionItemKind.Function;
            if (
                item.getMyAttributes().length === 0 &&
                item.extends &&
                defaultExtend &&
                item.extends === defaultExtend
            ) {
                completionItem.insertText = new vscode.SnippetString(name);
            } else {
                completionItem.insertText = new vscode.SnippetString(name + '{$0}');
                completionItem.command = retriggerCompletionsCommand;
            }
            completionItems.push(completionItem);
        });
    });
}

// Completes new lines
export function fileCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    objectmap: Schema
): vscode.CompletionItem[] | undefined {
    const keys = yamlutils.getParentKeys(document, position).reverse();
    if (keys.length === 0) {
        return undefined;
    }

    const result = fileCompletionFindNodesOnLevel(
        objectmap,
        yamlutils.getKeyNameFromYamlKey(keys).slice(1),
        1
    );
    if (!result) {
        return undefined;
    }
    const [keyobjects, level] = result;
    const thislineindentation = yamlutils.getIndentation(document.lineAt(position.line).text);
    const indentation = ' '.repeat(
        (level - thislineindentation / 2) * yamlutils.getDefaultIndentation()
    );

    if (!keyobjects) {
        return undefined;
    }

    if (keyobjects.type) {
        return fileCompletionForSchemaElement(keyobjects as SchemaElement, indentation);
    } else {
        return fileCompletionForSchema(keyobjects as Schema, indentation);
    }
}

function fileCompletionFindNodesOnLevel(
    objectmap: Schema,
    keys: string[],
    level: number
): [Schema | SchemaElement, number] | null {
    if (keys.length === 0) {
        return [objectmap, level];
    }

    const key = keys[0];

    const selectedObject = objectmap[key];

    if (selectedObject) {
        if (selectedObject.type === SchemaElementTypes.KEY && selectedObject.keys) {
            const result = fileCompletionFindNodesOnLevel(
                selectedObject.keys,
                keys.slice(1),
                level + 1
            );
            return result;
        }
        if (selectedObject.type === SchemaElementTypes.KEY_LIST) {
            return [selectedObject, level + 1];
        }
        if (selectedObject.type === SchemaElementTypes.LIST) {
            return [selectedObject, level];
        }
        return [objectmap, level];
    }

    if (SchemaElementSpecialKeys.WILDKEY in objectmap) {
        const wildcardObject = objectmap[SchemaElementSpecialKeys.WILDKEY]!;
        const result = fileCompletionFindNodesOnLevel(
            wildcardObject.keys,
            keys.slice(1),
            level + 1
        );
        return result;
    }

    return null;
}

// Completes the key itself
function fileCompletionForSchema(objectMap: Schema, indentation: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    Object.entries(objectMap).forEach(([key, value]) => {
        if (key === SchemaElementSpecialKeys.WILDKEY) {
            const completionItem = new vscode.CompletionItem(
                (value as WildKeySchemaElement).display,
                vscode.CompletionItemKind.File
            );
            completionItem.insertText = new vscode.SnippetString(indentation + '$1' + ':');
            completionItems.push(completionItem);
            return;
        }

        const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
        if (value.type === SchemaElementTypes.LIST) {
            completionItem.insertText = new vscode.SnippetString(
                indentation + key + ':\n' + indentation + '- $0'
            );
        } else if (value.type === SchemaElementTypes.BOOLEAN) {
            completionItem.insertText = new vscode.SnippetString(
                indentation + key + ': ${1|true,false|}$0'
            );
        } else if (value.type === SchemaElementTypes.KEY) {
            completionItem.insertText = new vscode.SnippetString(
                indentation + key + ':\n' + indentation + '  $0'
            );
        } else if (value.type === SchemaElementTypes.KEY_LIST) {
            completionItem.insertText = new vscode.SnippetString(
                indentation + key + ':\n' + indentation + '  $1: $2$0'
            );
        } else {
            completionItem.insertText = new vscode.SnippetString(indentation + key + ': $0');
        }

        completionItem.detail = value.description;
        completionItem.command = retriggerCompletionsCommand;
        completionItems.push(completionItem);
    });

    return completionItems;
}

// Completes the key's values prefix on newline
function fileCompletionForSchemaElement(
    object: SchemaElement,
    indentation: string
): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (object.type === SchemaElementTypes.LIST) {
        const completionItem = new vscode.CompletionItem('-', vscode.CompletionItemKind.Snippet);
        completionItem.insertText = new vscode.SnippetString(indentation + '- $0');
        completionItem.command = retriggerCompletionsCommand;
        completionItems.push(completionItem);
    } else if (object.type === SchemaElementTypes.KEY_LIST) {
        const completionItem = new vscode.CompletionItem(
            'New Key',
            vscode.CompletionItemKind.Snippet
        );
        completionItem.insertText = new vscode.SnippetString(indentation + '$1: $2');
        completionItem.command = retriggerCompletionsCommand;
        completionItems.push(completionItem);
    }

    return completionItems;
}

// Completes Invocations
export async function getCompletionForInvocation(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    type: Schema
): Promise<vscode.CompletionItem[] | undefined> {
    const keys = yamlutils.getKeyNameFromYamlKey(
        yamlutils.getParentKeys(document, position, true).reverse()
    );
    if (yamlutils.isKey(document, position.line)) {
        return getKeyObjectCompletion(keys.slice(1), type);
    } else if (yamlutils.isList(document, position.line)) {
        return getListObjectCompletion(keys.slice(1), type, document, position, context);
    }
    return undefined;
}

async function getKeyObjectCompletion(
    keys: string[],
    type: Schema
): Promise<vscode.CompletionItem[] | undefined> {
    const object = getSchemaElementInTree(keys, type);
    if (!object) {
        return undefined;
    }

    if (object.type === SchemaElementTypes.ENUM && object.dataset) {
        const dataset = ScribeEnumHandler.getEnum(object.dataset);
        const completionItems: vscode.CompletionItem[] = [];
        if (!dataset) {
            return undefined;
        }
        dataset.getDataset().forEach((item, value) => {
            const completionItem = getEnumCompletion(item, value);
            completionItem.insertText = new vscode.SnippetString(value);
            completionItems.push(completionItem);
        });
        return completionItems;
    } else if (
        (object.type === SchemaElementTypes.INTEGER || object.type === SchemaElementTypes.FLOAT) &&
        object.values
    ) {
        const completionItems: vscode.CompletionItem[] = [];
        object.values.forEach((value) => {
            const completionItem = new vscode.CompletionItem(
                value,
                vscode.CompletionItemKind.EnumMember
            );
            completionItem.sortText = value.toString().padStart(4, '0');
            completionItem.insertText = new vscode.SnippetString(value);
            completionItems.push(completionItem);
        });
        return completionItems;
    }
    return undefined;
}

function getListObjectCompletion(
    keys: string[],
    type: Schema,
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext
): vscode.CompletionItem[] | undefined {
    const object = getSchemaElementInTree(keys, type);
    if (!object) {
        return undefined;
    }

    if (object.type === SchemaElementTypes.LIST && object.dataset) {
        const space = getListCompletionNeededSpaces(document, position, context);
        if (space === undefined) {
            return undefined;
        }
        const dataset = ScribeEnumHandler.getEnum(object.dataset);
        if (!dataset) {
            return undefined;
        }
        const completionItems: vscode.CompletionItem[] = [];
        dataset.getDataset().forEach((item, value) => {
            const completionItem = getEnumCompletion(item, value);
            completionItem.insertText = new vscode.SnippetString(space + value);
            if (object.values) {
                completionItem.insertText.appendText(' ').appendChoice(object.values);
            }
            completionItems.push(completionItem);
        });
        return completionItems;
    }
    return undefined;
}

export function getEnumCompletion(item: EnumDatasetValue, value: string) {
    const completionItem = new vscode.CompletionItem(value, vscode.CompletionItemKind.Enum);
    if (item.description) {
        completionItem.detail = item.description;
    }
    return completionItem;
}
