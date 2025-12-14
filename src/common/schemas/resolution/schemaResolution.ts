import * as vscode from 'vscode';
import { retriggerCompletionsCommand } from '@common/constants';

import {
    SchemaElement,
    SchemaElementTypes,
    SchemaElementSpecialKeys,
    WildKeySchemaElement,
    getKeySchema,
    ArrayKeySchemaElement,
    Schema,
} from '../../objectInfos';
import { isPluginEnabled } from '../../providers/configProvider';
import { filterSchemaWithEnabledPlugins, getSchemaElement } from '../../utils/schemautils';
import {
    isEmptyLine,
    getParentKeys,
    getKeyNameFromYamlKey,
    getIndentation,
    getDefaultIndentation,
    isKey,
    getTextAfterKey,
    isList,
    getTextAfterListDash,
} from '../../utils/yamlutils';
import { getHandlerForElement } from './schemaElementResolutionMapping';
import { handleArrayKeySchemaKey } from './helpers';

// --- Main Entry Point ---
export async function generateFileCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    schema: Schema
): Promise<vscode.CompletionItem[] | undefined> {
    const filteredSchema = filterSchemaWithEnabledPlugins(schema);

    // 1. Structure Completion (New Lines)
    if (isEmptyLine(document, position.line)) {
        return resolveStructureCompletion(document, position, filteredSchema);
    }

    // 2. Value Completion (Invocation)
    if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
        return resolveValueCompletion(document, position, context, filteredSchema);
    }

    return undefined;
}

// --- Logic Implementations ---

/**
 * Resolves structure completion items for a given position in a YAML document.
 *
 * Analyzes the parent keys at the cursor position and retrieves the corresponding
 * schema node. Generates appropriate completion items based on the schema element type:
 * - LIST: Returns a snippet for adding a new list item (dash)
 * - KEY_LIST: Returns a snippet for adding a new dynamic key-value pair
 * - Schema object: Returns completion items for all possible keys
 *
 * @param document - The active text document being edited
 * @param position - The cursor position in the document
 * @param schema - The root schema object defining the YAML structure
 * @returns An array of completion items, or undefined if no completions are available
 */
function resolveStructureCompletion(
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
    const defaultIndent = getDefaultIndentation();
    const indentLevel = Math.max(0, level - thislineindentation / defaultIndent);
    const indentation = ' '.repeat(indentLevel * defaultIndent);

    if (!schemaObject) {
        return undefined;
    }

    // Specific handling for pure Lists (dash '-' completion)
    if ((schemaObject as SchemaElement).type === SchemaElementTypes.LIST) {
        const item = new vscode.CompletionItem('-', vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(indentation + '- $0');
        item.command = retriggerCompletionsCommand;
        return [item];
    }

    // If it's a KeyList, provide a snippet for adding a new dynamic key-value pair
    if ((schemaObject as SchemaElement).type === SchemaElementTypes.KEY_LIST) {
        const item = new vscode.CompletionItem('New Key', vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(indentation + '$1: $2');
        item.command = retriggerCompletionsCommand;
        return [item];
    }

    // generate completion items for all possible keys in the schema object
    if (!(schemaObject as SchemaElement).type) {
        return generateSchemaKeysCompletion(schemaObject as Schema, indentation);
    }

    return undefined;
}

/**
 * Genera i completion item per le chiavi di uno Schema.
 * Gestisce WildKey e ArrayKey espandendoli, poi delega la creazione dello snippet all'Handler del tipo.
 */
function generateSchemaKeysCompletion(
    schema: Schema,
    indentation: string
): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    Object.entries(schema).forEach(([key, element]) => {
        // WildKey handling
        if (key === SchemaElementSpecialKeys.WILDKEY) {
            const wildKeyElement = element as WildKeySchemaElement;
            const completionItem = new vscode.CompletionItem(
                wildKeyElement.display,
                vscode.CompletionItemKind.File
            );
            completionItem.insertText = new vscode.SnippetString(indentation + '$1' + ':');
            completionItems.push(completionItem);
            return;
        }

        // ArrayKey expansion vs Standard Key
        let iterableMapping: Array<{ key: string; element: SchemaElement }>;

        if (key === SchemaElementSpecialKeys.ARRAYKEY) {
            iterableMapping = handleArrayKeySchemaKey(element);
        } else {
            iterableMapping = [{ key, element }];
        }

        // Generation of Items delegated to Handlers
        for (const { key: mappedKey, element: mappedElement } of iterableMapping) {
            const handler = getHandlerForElement(mappedElement.type);
            const items = handler.provideStructureCompletion(mappedKey, mappedElement, indentation);
            completionItems.push(...items);
        }
    });

    return completionItems;
}

/**
 * Resolves suggestions for values (after invocation on key or list).
 */
async function resolveValueCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    rootSchema: Schema
): Promise<vscode.CompletionItem[] | undefined> {
    const parentKeys = getParentKeys(document, position, true).reverse();
    const cleanKeys = getKeyNameFromYamlKey(parentKeys).slice(1);

    let object: SchemaElement | undefined;
    let extractor: ((text: string) => string) | undefined;

    if (isKey(document, position.line)) {
        object = getSchemaElement(cleanKeys, rootSchema);
        extractor = getTextAfterKey;
    } else if (isList(document, position.line)) {
        object = getSchemaElement(cleanKeys, rootSchema);
        extractor = getTextAfterListDash;
    }

    if (!object || !isPluginEnabled(object.plugin)) {
        return undefined;
    }

    const handler = getHandlerForElement(object.type);

    return handler.provideValueCompletion(object, {
        document,
        position,
        context,
        textExtractor: extractor,
    });
}

/**
 * Finds nodes in a schema at a specific nesting level based on a path of keys.
 *
 * @param schema - The schema object to search within
 * @param keys - An array of keys representing the path to traverse
 * @param level - The current nesting level in the schema hierarchy
 * @returns A tuple containing the found schema or schema element and its level, or null if the path cannot be resolved
 *
 * @remarks
 * - Handles wildcard keys by recursively searching through wildcard schema objects
 * - Supports array keys by checking if a key matches possible array key values
 * - Returns early if a key is not found in the schema (unless a wildcard exists)
 * - Respects maxDepth constraints on KEY type elements
 * - Differentiates between KEY, KEY_LIST, and LIST schema element types
 */
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
