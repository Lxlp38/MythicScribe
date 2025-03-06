import * as vscode from 'vscode';

import { attributeSpecialValues } from '../datasets/enumSources';
import {
    AbstractScribeMechanicRegistry,
    MythicAttribute,
    ScribeMechanicHandler,
} from '../datasets/ScribeMechanic';
import { getSquareBracketObject } from './cursorutils';

const yamlkeyregex = /^\s*[^:\s]+:/;

export type YamlKey = [string, number];
export function getKeyNameFromYamlKey(keys: YamlKey[]): string[] {
    return keys.map(([key]) => key);
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
        const line = document.lineAt(i).text.trim();
        if (line.match(yamlkeyregex)) {
            return [line.split(':')[0].trim(), i];
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
        keys.push([getKey(document, lineIndex), lineIndex]);
    }

    for (let i = lineIndex; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();
        if (line.match(yamlkeyregex)) {
            const lineIndent = getIndentation(document.lineAt(i).text); // Get the indentation of this line

            // If the line has a lower (less) indentation, it is a parent
            if (lineIndent < currentIndent) {
                keys.push([line.split(':')[0], i]); // Add the key without the colon
                currentIndent = lineIndent; // Update current indentation to this parent's level
            }
        }
    }
    return keys;
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
 * @returns `true` if the line is a YAML key, `false` otherwise.
 */
export function isKey(document: vscode.TextDocument, lineIndex: number): boolean {
    const line = document.lineAt(lineIndex).text.trim();
    // If we are inside a key, we're not inside the Skills section
    if (line.match(yamlkeyregex)) {
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
        if (line.match(yamlkeyregex)) {
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
