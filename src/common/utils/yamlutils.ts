import * as vscode from 'vscode';

import { attributeSpecialValues } from '../datasets/enumSources';
import {
    AbstractScribeMechanicRegistry,
    MythicAttribute,
    ScribeMechanicHandler,
} from '../datasets/ScribeMechanic';
import { getSquareBracketObject } from './cursorutils';
import { FileObject, FileObjectMap, FileObjectSpecialKeys } from '../objectInfos';
import { ArrayListNode } from './genericDataStructures';
import { checkFileType } from '../subscriptions/SubscriptionHelper';

const yamlKeyRegex = /^(?<indent>\s*)(?<key>[^#:\s]+):/;
function getYamlRegexInfo(match: RegExpMatchArray): { indent: string; key: string } {
    return {
        indent: match.groups!.indent,
        key: match.groups!.key,
    };
}

export type YamlKey = {
    key: string;
    line: number;
    indent: number;
};
export function getKeyNameFromYamlKey(keys: YamlKey[]): string[] {
    return keys.map((key) => key.key);
}

/**
 * Retrieves the key and its position from the nearest upstream YAML key in a document.
 *
 * @param document - The text document to search within.
 * @param lineIndex - The line index to start searching from.
 * @returns A tuple containing the key as a string and its position as a `vscode.Position`, or `undefined` if no key is found.
 */
export function getUpstreamKey(
    document: vscode.TextDocument,
    lineIndex: number
): YamlKey | undefined {
    for (let i = lineIndex; i >= 0; i--) {
        const line = document.lineAt(i).text;
        const match = line.match(yamlKeyRegex);
        if (match) {
            const info = getYamlRegexInfo(match);
            return {
                key: info.key,
                line: i,
                indent: info.indent.length,
            };
        }
    }
    return;
}

export function getUpstreamKeyFromString(text: string): string | undefined {
    const lines = text.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        const match = line.match(yamlKeyRegex);
        if (match) {
            return getYamlRegexInfo(match).key;
        }
    }
    return;
}

/**
 * Retrieves the parent keys of a YAML document at a given position.
 *
 * @param document - The text document containing the YAML content.
 * @param position - The position within the document to retrieve parent keys for.
 * @param getLineKey - Optional flag to include the key of the current line if it is a key. Defaults to false.
 * @returns An array of parent keys as strings.
 */
export function getParentKeys(
    document: vscode.TextDocument,
    position: vscode.Position,
    getLineKey: boolean = false
): YamlKey[] {
    const keys: YamlKey[] = [];
    const lineIndex = position.line;

    let currentIndent = getIndentation(document.lineAt(lineIndex).text); // Get the indentation of the current line

    if (!isKey(document, lineIndex)) {
        currentIndent += 1;
    } else if (getLineKey) {
        keys.push({
            key: getKey(document, lineIndex),
            line: lineIndex,
            indent: currentIndent,
        });
    }

    for (let i = lineIndex; i >= 0; i--) {
        const line = document.lineAt(i).text;
        const match = line.match(yamlKeyRegex);
        if (match) {
            const matchInfo = getYamlRegexInfo(match);
            const lineIndent = matchInfo.indent.length; // Get the indentation of the line

            // If the line has a lower (less) indentation, it is a parent
            if (lineIndent < currentIndent) {
                keys.push({
                    key: matchInfo.key,
                    line: i,
                    indent: lineIndent,
                }); // Add the key without the colon
                currentIndent = lineIndent; // Update current indentation to this parent's level
            }
        }
    }
    return keys;
}

export function getDocumentKeys(text: string): YamlKey[] {
    const keys: YamlKey[] = [];
    const similDoc = text.split('\n');
    for (let i = 0; i < similDoc.length; i++) {
        const line = similDoc[i];
        const match = line.match(yamlKeyRegex);
        if (match) {
            const info = getYamlRegexInfo(match);
            keys.push({
                key: info.key,
                line: i,
                indent: info.indent.length,
            });
        }
    }
    return keys;
}

/**
 * Recursively groups YAML keys into a tree and pairs nested keys with a schema.
 *
 * @param keys - The list of YAML keys (already sorted by line number).
 * @param baseIndent - The indentation level of the parent node.
 * @param schemaMapping - The mapping used to look up nested keys. For top-level keys,
 *                        this will be the overall schema mapping.
 * @returns A hierarchical tree of YamlKeyPair.
 */
function buildYamlKeyTree(
    keys: YamlKey[],
    baseIndent: number,
    schemaMapping: FileObjectMap | null
): YamlKeyPair[] {
    const pairs: YamlKeyPair[] = [];
    let i = 0;

    while (i < keys.length) {
        const current = keys[i];
        const keyName = current.key;
        const indent = current.indent;
        if (indent <= baseIndent) {
            // This key is not a child of the current parent.
            break;
        }

        // For nested keys (indent > baseIndent) we want to look up in the schema mapping.
        // Remove a potential trailing colon from the key name.
        let fileObj: FileObject | undefined = undefined;
        let childSchema: FileObjectMap | null = null;
        if (schemaMapping) {
            fileObj = schemaMapping[keyName];

            if (!fileObj && FileObjectSpecialKeys.WILDKEY in schemaMapping) {
                // If the schema has a wildcard key, use that as a fallback.
                fileObj = schemaMapping[FileObjectSpecialKeys.WILDKEY];
            }

            // If the file object defines nested keys, use that mapping for its children.
            if (fileObj && 'keys' in fileObj && fileObj.keys) {
                childSchema = fileObj.keys;
            }
        }

        // Collect all keys that are children of the current key (indent greater than current).
        const start = i + 1;
        let j = start;
        const childKeys: YamlKey[] = [];
        while (j < keys.length && keys[j].indent > indent) {
            childKeys.push(keys[j]);
            j++;
        }

        // Recursively build children, using the file object's nested schema (if available)
        // or null (if no file object or nested keys mapping was found).
        const children = buildYamlKeyTree(childKeys, indent, childSchema);
        pairs.push({
            yamlKey: current,
            fileObject: fileObj,
            children: children.length ? children : undefined,
        });
        i = j;
    }

    return pairs;
}

/**
 * Pairs the YAML keys with a file object schema.
 *
 * Top-level keys (indent level 0) are not looked up in the schema; instead,
 * the provided schema mapping is used to pair their children.
 *
 * @param keys - The sorted list of YAML keys (e.g. from your YamlKeyList).
 * @param schemaMapping - The FileObjectMap used for nested key lookups.
 * @returns A tree of YamlKeyPair with top-level keys and nested pairs.
 */
export function pairYamlKeysWithSchema(
    keys: YamlKey[],
    schemaMapping: FileObjectMap
): YamlKeyPair[] {
    const pairs: YamlKeyPair[] = [];
    let i = 0;

    // Process only top-level keys (indent 0).
    while (i < keys.length) {
        const current = keys[i];
        const indent = current.indent;
        if (indent !== 0) {
            // Skip stray keys that are not at top level.
            i++;
            continue;
        }

        // For each top-level key, all subsequent keys with indent > 0 are its children.
        const start = i + 1;
        let j = start;
        const childKeys: YamlKey[] = [];
        while (j < keys.length && keys[j].indent > 0) {
            childKeys.push(keys[j]);
            j++;
        }

        // Process children: for nested keys we look up the schema.
        const children = buildYamlKeyTree(childKeys, 0, schemaMapping);
        pairs.push({
            yamlKey: current,
            // Top-level keys are not paired to a file object.
            fileObject: undefined,
            children: children.length ? children : undefined,
        });
        i = j;
    }
    return pairs;
}

// An interface to represent the pairing between a YAML key and its FileObject,
// including any children that were paired recursively.
interface YamlKeyPair {
    yamlKey: YamlKey;
    fileObject?: FileObject;
    children?: YamlKeyPair[];
}

export class YamlKeyPairList extends ArrayListNode<YamlKeyPair> {
    constructor(keys: YamlKey[], schema?: FileObjectMap) {
        if (keys.length === 0 || !schema) {
            super([]);
            return;
        }
        const pairedKeys = pairYamlKeysWithSchema(keys, schema);
        const allKeys: YamlKeyPair[] = [];

        function pushAll(keys: YamlKeyPair[]): void {
            for (const key of keys) {
                allKeys.push(key);
                if (key.children) {
                    pushAll(key.children);
                }
            }
        }
        pushAll(pairedKeys);
        super(allKeys);
    }

    compare(value1: YamlKeyPair, value2: YamlKeyPair | number): boolean {
        if (typeof value2 === 'number') {
            return value1.yamlKey.line < value2;
        }
        return value1.yamlKey.line < value2.yamlKey.line;
    }
}

export function getDocumentSearchList(text: string, document: vscode.TextDocument) {
    const keys = getDocumentKeys(text);
    return new YamlKeyPairList(keys, checkFileType(document.uri)?.schema);
}

/**
 * Calculates the indentation level of a given line of text.
 *
 * @param line - The line of text to measure the indentation of.
 * @returns The number of leading whitespace characters in the line.
 */
export function getIndentation(line: string): number {
    return line.length - line.trimStart().length;
}

/**
 * Retrieves the default indentation size for the active text editor in Visual Studio Code.
 * If there is no active text editor, it defaults to 2 spaces.
 *
 * @returns {number} The number of spaces used for indentation.
 */
export function getDefaultIndentation(): number {
    return vscode.window.activeTextEditor
        ? (vscode.window.activeTextEditor.options.tabSize as number)
        : 2;
}

/**
 * Determines the indentation level used in a YAML string.
 *
 * This function searches for the first occurrence of a key-value pair in the YAML string
 * and returns the number of spaces used for indentation.
 *
 * @param text - The YAML string to analyze.
 * @returns The number of spaces used for indentation. If no indentation is found, it returns the default indentation.
 */
export function getUsedIndentation(text: string): number {
    const match = text.match(/^[^:]+:\s*?\n(\s+)\S/m);
    if (match) {
        return match[1].length;
    }
    return getDefaultIndentation();
}

/**
 * Checks if a specified line in a given text document is empty or contains only whitespace.
 *
 * @param document - The text document to check.
 * @param lineIndex - The index of the line to check.
 * @returns `true` if the line is empty or contains only whitespace, otherwise `false`.
 */
export function isEmptyLine(document: vscode.TextDocument, lineIndex: number): boolean {
    return /^\s*$/.test(document.lineAt(lineIndex).text);
}

/**
 * Checks if the specified line in the document is a YAML key.
 *
 * @param document - The text document to check.
 * @param lineIndex - The index of the line to check.
 * @param precise - Optional precise position to check if specifically the supplied position is a key.
 * @returns `true` if the line is a YAML key, `false` otherwise.
 */
export function isKey(
    document: vscode.TextDocument,
    lineIndex: number,
    precise?: vscode.Position
): boolean {
    const line = document.lineAt(lineIndex).text;
    if (precise) {
        const match = line.match(yamlKeyRegex);
        if (match) {
            const info = getYamlRegexInfo(match);
            const startIndex = info.indent.length;
            const endIndex = startIndex + info.key.length;
            return precise.character < endIndex && precise.character >= startIndex;
        }
    } else if (yamlKeyRegex.test(line)) {
        return true;
    }
    return false;
}

/**
 * Checks if the specified line in a document is a list item in YAML format.
 *
 * @param document - The text document to check.
 * @param lineIndex - The index of the line to check.
 * @returns `true` if the line is a list item, otherwise `false`.
 */
export function isList(document: vscode.TextDocument, lineIndex: number): boolean {
    const line = document.lineAt(lineIndex).text.trim();
    return /^\s*-\s?/.test(line);
}

/**
 * Extracts the key from a YAML document line.
 *
 * @param document - The text document containing the YAML content.
 * @param lineIndex - The index of the line from which to extract the key.
 * @returns The key as a string.
 */
export function getKey(document: vscode.TextDocument, lineIndex: number): string {
    const line = document.lineAt(lineIndex).text.trim();
    return line.split(':')[0];
}

/**
 * Function to determine if the current line is inside a specific key in the YAML file
 * @param document - The TextDocument of the YAML file
 * @param lineIndex - The index of the current line
 * @param key - The key to check for
 * @returns Whether the current line is inside the specified key
 */
export function isInsideKey(
    document: vscode.TextDocument,
    lineIndex: number,
    key: string
): boolean {
    if (isKey(document, lineIndex)) {
        return false;
    }

    // Traverse upwards to check if we are under the specified key
    for (let i = lineIndex; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();
        // If we find the specified key, we know we're inside it
        if (line.startsWith(`${key}:`)) {
            return true;
        }
        // If we find another top-level key, we know we've left the specified section
        if (line.match(yamlKeyRegex)) {
            return false;
        }
    }
    return false;
}

/**
 * Function to get the word before a given position in the document
 * @param document - The TextDocument of the YAML file
 * @param position - The position in the document
 * @returns The word before the given position
 */
export function getWordBeforePosition(
    document: vscode.TextDocument,
    position: vscode.Position
): string {
    // Get the text of the line up to the cursor position
    const lineText = document.lineAt(position.line).text.substring(0, position.character);
    // Split the line into words based on whitespace
    const words = lineText.trim().split(/\s+/);
    // Calculate the target index
    const targetIndex = words.length - 1;
    // Ensure the target index is valid
    if (targetIndex >= 0 && targetIndex < words.length) {
        return words[targetIndex];
    }
    // Return an empty string if the index is invalid
    return '';
}

/**
 * Extracts and parses a mechanic line from a given document at a specified line index.
 * The mechanic line is expected to follow a specific pattern and the function will
 * return a map containing the parsed components of the mechanic line.
 *
 * @param document - The text document containing the mechanic line.
 * @param lineIndex - The index of the line to be parsed in the document.
 * @returns A map containing the parsed components of the mechanic line:
 * - 'mechanic': The main mechanic.
 * - 'targeter': (Optional) The targeter associated with the mechanic.
 * - 'trigger': (Optional) The trigger associated with the mechanic.
 * - 'conditions': (Optional) The conditions associated with the mechanic.
 */
export function getMechanicLine(
    document: vscode.TextDocument,
    lineIndex: number
): Map<string, string> {
    const mechanicMap = new Map<string, string>();
    const line = document.lineAt(lineIndex).text.trim();
    const matches = line.match(/- (\S*)(\s+@\S*)?(\s+~\S*)?(\s+\?~?!?\S*)*/);
    if (matches) {
        const mechanic = matches[1];
        const targeter = matches[2];
        const trigger = matches[3];
        const conditions = matches[4];
        mechanicMap.set('mechanic', mechanic);
        if (targeter) {
            mechanicMap.set('targeter', targeter.trim());
        }
        if (trigger) {
            mechanicMap.set('trigger', trigger.trim());
        }
        if (conditions) {
            mechanicMap.set('conditions', conditions.trim());
        }
    }
    return mechanicMap;
}

export const PreviousSymbolRegexes = {
    nonspace: /([^\w\s:])[\w\s:]*$/,
    default: /([^\w:])[\w:]*$/,
    bracket: /[()\[\]{}][^()\[\]{}]*$/,
};

/**
 * Retrieves the previous non-word character before the current position in the document.
 *
 * @param document - The text document to analyze.
 * @param position - The position in the document to check from.
 * @returns The previous non-word character before the current position, or an empty string if none is found.
 */
export function previousSymbol(
    regex: RegExp,
    document: vscode.TextDocument,
    position: vscode.Position,
    depth: number = 0
): string {
    const line = document.lineAt(position.line).text;
    const text = line.substring(0, position.character);
    const matches = text.match(regex);
    if (matches) {
        return matches[1];
    }
    if (depth > 0 && position.line > 0) {
        if (line.trim() === '') {
            return previousSymbol(regex, document, position.translate(-1), depth);
        }
        const endOfPreviousLine = new vscode.Position(
            position.line - 1,
            document.lineAt(position.line - 1).text.length
        );
        return previousSymbol(regex, document, endOfPreviousLine, depth - 1);
    }
    return '';
}

/**
 * Checks if the given position in the document is after a comment.
 *
 * @param document - The text document to check.
 * @param position - The position within the document to check.
 * @returns `true` if the position is after a comment, otherwise `false`.
 */
export function isAfterComment(document: vscode.TextDocument, position: vscode.Position): boolean {
    const textBeforePosition = document.lineAt(position.line).text.substring(0, position.character);
    return /\s#/.test(textBeforePosition);
}

export function isInsideInlineConditionList(
    document: vscode.TextDocument,
    position: vscode.Position,
    ...registry: AbstractScribeMechanicRegistry[]
) {
    const maybeAttribute = getSquareBracketObject(document, position);
    if (maybeAttribute && maybeAttribute[0] && maybeAttribute[1]) {
        let attribute: undefined | MythicAttribute;
        if (maybeAttribute[1].startsWith('@')) {
            attribute = ScribeMechanicHandler.registry.targeter
                .getMechanicByName(maybeAttribute[1].replace('@', ''))
                ?.getAttributeByName(maybeAttribute[0]);
        } else {
            for (const r of registry) {
                attribute = r
                    .getMechanicByName(maybeAttribute[1])
                    ?.getAttributeByName(maybeAttribute[0]);
                if (attribute) {
                    break;
                }
            }
        }
        if (attribute && attribute.specialValue === attributeSpecialValues.conditions) {
            return true;
        }
    }
    return false;
}

export function getLastNonCommentLine(text: string): number {
    const lines = text.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
        const trimmed = lines[i].trim();
        if (trimmed.length > 0 && !trimmed.startsWith('#')) {
            return i;
        }
    }
    return 0;
}
