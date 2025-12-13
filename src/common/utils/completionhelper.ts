import * as vscode from 'vscode';
import { getScribeEnumHandler } from '@common/datasets/ScribeEnum';
import { EnumDatasetValue } from '@common/datasets/types/Enum';
import { retriggerCompletionsCommand } from '@common/constants';

import {
    getDefaultIndentation,
    getIndentation,
    getKeyNameFromYamlKey,
    getParentKeys,
    getTextAfterKey,
    getTextAfterListDash,
    isAfterComment,
    isEmptyLine,
    isKey,
    isList,
    previousSymbol,
    PreviousSymbolRegexes,
} from './yamlutils';
import {
    Schema,
    SchemaElement,
    SchemaElementTypes,
    SchemaElementSpecialKeys,
    WildKeySchemaElement,
    getKeySchema,
    EntrySchemaElement,
    ArrayKeySchemaElement,
} from '../objectInfos';
import { filterSchemaWithEnabledPlugins, getSchemaElement } from './schemautils';
import { isPluginEnabled } from '../providers/configProvider';

type CompletionSchemaContext = {
    document?: vscode.TextDocument;
    position?: vscode.Position;
    context?: vscode.CompletionContext;
    suffix?: string;
    command?: vscode.Command;
    textExtractor?: (text: string) => string;
};

function handleEntryListSchemaElement(
    object: EntrySchemaElement,
    context: CompletionSchemaContext
): vscode.CompletionItem[] | undefined {
    if (
        object.entries === undefined ||
        context.document === undefined ||
        context.position === undefined ||
        context.textExtractor === undefined
    ) {
        return undefined;
    }
    const substringOnLineBeforePosition = context.document
        .lineAt(context.position.line)
        .text.substring(0, context.position.character);
    const entryIndex = Math.max(
        context
            .textExtractor(substringOnLineBeforePosition)
            .replace(/{.*?}/g, '')
            .trimStart()
            .split(' ')
            .filter((v) => v !== '').length,
        0
    );
    // console.log('Substring: ' + substringOnLineBeforePosition);
    // console.log('Entry Index: ' + entryIndex);
    const neededEntry = object.entries[entryIndex];
    const hasNext = object.entries.length > entryIndex + 1;
    if (neededEntry) {
        return getCompletionsForSchemaElement(neededEntry, {
            ...context,
            suffix: hasNext ? ' ' : '',
            command: hasNext ? retriggerCompletionsCommand : undefined,
        });
    }
    return undefined;
}

function getCompletionsForSchemaElement(
    object: SchemaElement,
    context: CompletionSchemaContext = {}
): vscode.CompletionItem[] | undefined {
    // console.log('Getting completions for schema element of type: ' + object.type);
    // console.log(object);
    // console.log(context);
    if (object.type === SchemaElementTypes.ENUM) {
        const dataset = getScribeEnumHandler().getEnum(object.dataset);
        const completionItems: vscode.CompletionItem[] = [];
        if (!dataset) {
            return undefined;
        }
        dataset.getDataset().forEach((item, value) => {
            const completionItem = getEnumCompletion(item, value);
            completionItem.insertText = new vscode.SnippetString(value + (context.suffix ?? ''));
            if (context.command) {
                completionItem.command = context.command;
            }
            completionItems.push(completionItem);
        });
        return completionItems;
    }

    if (object.type === SchemaElementTypes.LIST) {
        const { document, position, context: ctx } = context;
        if (!document || !position || !ctx) {
            return undefined;
        }
        if (object.dataset) {
            const space = getListCompletionNeededSpaces(document, position, ctx);
            if (space === undefined) {
                return undefined;
            }
            const dataset = getScribeEnumHandler().getEnum(object.dataset);
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
        } else if (object.entries && object.entries.length > 0) {
            return handleEntryListSchemaElement(object, context);
        }
        return undefined;
    }

    if (object.type === SchemaElementTypes.ENTRY_LIST) {
        return handleEntryListSchemaElement(object, context);
    }

    if (object.type === SchemaElementTypes.BOOLEAN) {
        const completionItems: vscode.CompletionItem[] = [];
        ['true', 'false'].forEach((value) => {
            const completionItem = new vscode.CompletionItem(
                value,
                vscode.CompletionItemKind.EnumMember
            );
            completionItem.insertText = new vscode.SnippetString(value + (context.suffix ?? ''));
            if (context.command) {
                completionItem.command = context.command;
            }
            completionItems.push(completionItem);
        });
        return completionItems;
    }

    // Fallback: provide values if they exist
    if (object.values) {
        const completionItems: vscode.CompletionItem[] = [];
        object.values.forEach((value) => {
            const completionItem = new vscode.CompletionItem(
                value,
                vscode.CompletionItemKind.EnumMember
            );
            completionItem.sortText = value.toString().padStart(4, '0');
            completionItem.insertText = new vscode.SnippetString(value + (context.suffix ?? ''));
            if (context.command) {
                completionItem.command = context.command;
            }
            completionItems.push(completionItem);
        });
        return completionItems;
    }

    return undefined;
}

// Generates completions for normal mythic schemas
export async function generateFileCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    schema: Schema
): Promise<vscode.CompletionItem[] | undefined> {
    const filteredSchema = filterSchemaWithEnabledPlugins(schema);
    if (isEmptyLine(document, position.line)) {
        return fileCompletions(document, position, filteredSchema);
    }
    if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
        return getCompletionForInvocation(document, position, context, filteredSchema);
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
        const specialSymbol = previousSymbol(PreviousSymbolRegexes.nonspace, document, position);
        if (specialSymbol !== '-') {
            return undefined;
        }
        const charBefore = getCharBefore(document, position, 1);
        if (charBefore === '-') {
            return ' ';
        } else {
            return '';
        }
    } else {
        const charBefore2 = getCharBefore(document, position, 2);
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
        !isAfterComment(document, position) &&
        checkShouldKeyCompleteExec(document, position, keylist) &&
        checkShouldPrefixCompleteExec(document, position, context, symbol)
    );
}

export function checkShouldKeyComplete(
    document: vscode.TextDocument,
    position: vscode.Position,
    keylist: string[]
) {
    if (isAfterComment(document, position)) {
        return false;
    }
    return checkShouldKeyCompleteExec(document, position, keylist);
}
function checkShouldKeyCompleteExec(
    document: vscode.TextDocument,
    position: vscode.Position,
    keylist: string[]
) {
    const keys = getParentKeys(document, position);
    if (keys.length === 0) {
        return false;
    }
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
    if (isAfterComment(document, position)) {
        return false;
    }
    return checkShouldPrefixCompleteExec(document, position, context, symbol, depth);
}
export function checkShouldPrefixCompleteExec(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    symbol: string[],
    depth = 0
): boolean {
    // called via invocation
    if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
        const mypreviousSpecialSymbol = previousSymbol(
            PreviousSymbolRegexes.default,
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
    const charBefore = getCharBefore(document, position, 1);
    if (symbol.includes(charBefore)) {
        return true;
    }
    return false;
}

// Completes new lines
export function fileCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    schema: Schema
): vscode.CompletionItem[] | undefined {
    const keys = getParentKeys(document, position).reverse();
    if (keys.length === 0) {
        return undefined;
    }
    const result = fileCompletionFindNodesOnLevel(schema, getKeyNameFromYamlKey(keys).slice(1), 1);
    if (!result) {
        return undefined;
    }
    const [schemaObject, level] = result;
    const thislineindentation = getIndentation(document.lineAt(position.line).text);
    const indentation = ' '.repeat((level - thislineindentation / 2) * getDefaultIndentation());

    if (!schemaObject) {
        return undefined;
    }
    if (schemaObject.type) {
        return fileCompletionForSchemaElement(schemaObject as SchemaElement, indentation);
    } else {
        return fileCompletionForSchema(schemaObject as Schema, indentation);
    }
}

function fileCompletionFindNodesOnLevel(
    schema: Schema,
    keys: string[],
    level: number
): [Schema | SchemaElement, number] | null {
    if (keys.length === 0) {
        return [schema, level];
    }

    let key = keys[0];

    if (!(key in schema)) {
        if (SchemaElementSpecialKeys.WILDKEY in schema) {
            const wildcardObject = schema[SchemaElementSpecialKeys.WILDKEY]!;
            const result = fileCompletionFindNodesOnLevel(
                getKeySchema(wildcardObject.keys),
                keys.slice(1),
                level + 1
            );
            return result;
        }
        if (SchemaElementSpecialKeys.ARRAYKEY in schema) {
            const possibleKeys = (
                schema[SchemaElementSpecialKeys.ARRAYKEY] as ArrayKeySchemaElement
            ).possibleKeyValues();
            if (possibleKeys.has(key)) {
                key = SchemaElementSpecialKeys.ARRAYKEY;
            }
        }
        return null;
    }

    const selectedElement = schema[key];

    if (selectedElement.type === SchemaElementTypes.KEY && selectedElement.keys) {
        if (selectedElement.maxDepth) {
            return [getKeySchema(selectedElement.keys), level + 1];
        }
        const result = fileCompletionFindNodesOnLevel(
            getKeySchema(selectedElement.keys),
            keys.slice(1),
            level + 1
        );
        return result;
    }
    if (selectedElement.type === SchemaElementTypes.KEY_LIST) {
        return [selectedElement, level + 1];
    }
    if (selectedElement.type === SchemaElementTypes.LIST) {
        return [selectedElement, level];
    }
    return [schema, level];
}

// Completes the key itself
function fileCompletionForSchema(schema: Schema, indentation: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    Object.entries(schema).forEach(([key, element]) => {
        const iterableKeys = [key];
        if (key === SchemaElementSpecialKeys.WILDKEY) {
            const completionItem = new vscode.CompletionItem(
                (element as WildKeySchemaElement).display,
                vscode.CompletionItemKind.File
            );
            completionItem.insertText = new vscode.SnippetString(indentation + '$1' + ':');
            completionItems.push(completionItem);
            return;
        }
        if (key === SchemaElementSpecialKeys.ARRAYKEY) {
            iterableKeys.length = 0;
            iterableKeys.push(...(element as ArrayKeySchemaElement).possibleKeyValues().keys());
        }

        for (const key of iterableKeys) {
            const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
            if (element.type === SchemaElementTypes.LIST) {
                completionItem.insertText = new vscode.SnippetString(
                    indentation + key + ':\n' + indentation + '- $0'
                );
            } else if (element.type === SchemaElementTypes.BOOLEAN) {
                completionItem.insertText = new vscode.SnippetString(
                    indentation + key + ': ${1|true,false|}$0'
                );
            } else if (element.type === SchemaElementTypes.KEY) {
                completionItem.insertText = new vscode.SnippetString(
                    indentation + key + ':\n' + indentation + '  $0'
                );
            } else if (element.type === SchemaElementTypes.KEY_LIST) {
                completionItem.insertText = new vscode.SnippetString(
                    indentation + key + ':\n' + indentation + '  $1: $2$0'
                );
            } else {
                completionItem.insertText = new vscode.SnippetString(indentation + key + ': $0');
            }

            completionItem.detail = element.description;
            completionItem.command = retriggerCompletionsCommand;
            completionItems.push(completionItem);
        }
    });

    return completionItems;
}

// Completes the key's values prefix on newline
function fileCompletionForSchemaElement(
    element: SchemaElement,
    indentation: string
): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (element.type === SchemaElementTypes.LIST) {
        const completionItem = new vscode.CompletionItem('-', vscode.CompletionItemKind.Snippet);
        completionItem.insertText = new vscode.SnippetString(indentation + '- $0');
        completionItem.command = retriggerCompletionsCommand;
        completionItems.push(completionItem);
    } else if (element.type === SchemaElementTypes.KEY_LIST) {
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
    const keys = getKeyNameFromYamlKey(getParentKeys(document, position, true).reverse());
    if (isKey(document, position.line)) {
        return getKeyObjectCompletion(keys.slice(1), type, document, position, context);
    } else if (isList(document, position.line)) {
        return getListObjectCompletion(keys.slice(1), type, document, position, context);
    }
    return undefined;
}

async function getKeyObjectCompletion(
    keys: string[],
    type: Schema,
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext
): Promise<vscode.CompletionItem[] | undefined> {
    const object = getSchemaElement(keys, type);
    if (!object || !isPluginEnabled(object.plugin)) {
        return undefined;
    }
    return getCompletionsForSchemaElement(object, {
        document,
        position,
        context,
        textExtractor: getTextAfterKey,
    });
}

function getListObjectCompletion(
    keys: string[],
    type: Schema,
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext
): vscode.CompletionItem[] | undefined {
    const object = getSchemaElement(keys, type);
    if (!object || !isPluginEnabled(object.plugin)) {
        return undefined;
    }
    return getCompletionsForSchemaElement(object, {
        document,
        position,
        context,
        textExtractor: getTextAfterListDash,
    });
}

/**
 * Creates a completion item for an enum value.
 *
 * @param item - The dataset value containing metadata about the enum.
 * @param value - The string representation of the enum value.
 * @returns A `vscode.CompletionItem` representing the enum value for autocompletion.
 */
export function getEnumCompletion(item: EnumDatasetValue, value: string) {
    const completionItem = new vscode.CompletionItem(value, vscode.CompletionItemKind.Enum);
    completionItem.detail = item.description;
    return completionItem;
}

/**
 * Retrieves the character(s) before a specified position in a text document.
 *
 * @param document - The text document from which to retrieve the character(s).
 * @param position - The position in the document to check before.
 * @param offset - The number of characters to look back from the specified position.
 * @returns The character(s) before the specified position, or an empty string if the offset exceeds the position's character index.
 */
export function getCharBefore(
    document: vscode.TextDocument,
    position: vscode.Position,
    offset: number
): string {
    if (position.character < offset) {
        return '';
    }
    return document.getText(new vscode.Range(position.translate(0, -offset), position));
}
