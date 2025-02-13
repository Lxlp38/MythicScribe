import * as vscode from 'vscode';

import { AbstractScribeMechanicRegistry, ScribeMechanicHandler } from '../datasets/ScribeMechanic';

/**
 * Function to find the object linked to an unbalanced '{' in the format object{attribute1=value1;attribute2=value2}
 * @param document - The TextDocument in which you're searching
 * @param position - The Position of the attribute in the text
 * @returns The object linked to the attribute, or null if no object is found
 */
export function getObjectLinkedToAttribute(
    document: vscode.TextDocument,
    position: vscode.Position
): string | null {
    // Get the text from the beginning of the document to the current position
    const textBeforeAttribute = document.getText(
        new vscode.Range(new vscode.Position(0, 0), position)
    );

    let openBraceCount = 0;

    // Traverse backwards through the text before the position
    for (let i = textBeforeAttribute.length - 1; i >= 0; i--) {
        const char = textBeforeAttribute[i];

        if (char === '}' || char === ']') {
            openBraceCount++;
        } else if (char === '{' || char === '[') {
            openBraceCount--;
            // If the brace count becomes negative, we've found an unbalanced opening '{'
            if (openBraceCount < 0) {
                // Get the text before the '{' which should be the object
                const textBeforeBrace = textBeforeAttribute.substring(0, i).trim();

                // Use a regex to find the object name before the '{'
                const objectMatch = textBeforeBrace.match(/(?<=[ =])([@~]|(\?~?!?))?[\w:]+$/); // Match the last word before the brace
                if (objectMatch && objectMatch[0]) {
                    return objectMatch[0]; // Return the object name
                }

                return null; // No object found before '{'
            }
        }
    }

    return null; // No unbalanced opening brace found
}

/**
 * Retrieves the attribute name linked to a value at a given position in a document.
 *
 * @param document - The text document to search within.
 * @param position - The position in the document to search up to.
 * @returns The attribute name if found, otherwise `null`.
 */
export function getAttributeLinkedToValue(
    document: vscode.TextDocument,
    position: vscode.Position
): string | null {
    const textBeforeValue = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
    const attributeMatch = textBeforeValue.match(/[{;]\s*\b(\w+)\b=[^;]*$/);
    if (attributeMatch && attributeMatch[1]) {
        return attributeMatch[1];
    }
    return null;
}

/**
 * Fetches the mechanic skill at the given cursor position within the document.
 *
 * @param document - The text document in which to search for the mechanic skill.
 * @param position - The position of the cursor within the document.
 * @param registry - The registry containing the mechanics and their corresponding regex patterns.
 * @returns The mechanic skill found at the cursor position, or null if no mechanic is found.
 */
export function fetchCursorSkills(
    document: vscode.TextDocument,
    position: vscode.Position,
    registry: AbstractScribeMechanicRegistry
) {
    const maybeMechanic = document.getWordRangeAtPosition(position, registry.regex);
    if (maybeMechanic) {
        const mechanic = document.getText(maybeMechanic);
        return registry.getMechanicByName(mechanic);
    }
    return null;
}

/**
 * Retrieves the skill or attribute at the given cursor position within the document.
 *
 * This function checks various types of objects (mechanics, targeters, triggers, inline conditions)
 * to determine if the cursor is positioned over a skill. If no skill is found, it then checks for
 * attributes and attempts to link them to the corresponding object.
 *
 * @param document - The text document being edited.
 * @param position - The position of the cursor within the document.
 * @returns The skill or attribute at the cursor position, or `null` if none is found.
 */
export function getCursorSkills(document: vscode.TextDocument, position: vscode.Position) {
    for (const objectType of [
        ScribeMechanicHandler.registry.mechanic,
        ScribeMechanicHandler.registry.targeter,
        ScribeMechanicHandler.registry.trigger,
        ScribeMechanicHandler.registry.inlinecondition,
    ]) {
        const maybeObject = fetchCursorSkills(document, position, objectType);
        if (maybeObject) {
            return maybeObject;
        }
    }
    const maybeAttribute = document.getWordRangeAtPosition(position, /\w+(?=\s*=)/s);
    const textBeforePosition = document.getText(
        new vscode.Range(new vscode.Position(0, 0), position.translate(0, 1))
    );
    const maybeAttributeMatch = textBeforePosition.match(/(?<=[{;]\s*)(\w+)$/gm);
    if (maybeAttribute && maybeAttributeMatch) {
        const attribute = document.getText(maybeAttribute);
        const object = getObjectLinkedToAttribute(document, position);
        if (!object || object.startsWith('~')) {
            return null;
        }
        if (object.startsWith('@')) {
            const targeter = ScribeMechanicHandler.registry.targeter.getMechanicByName(
                object.replace('@', '')
            );
            return targeter ? targeter.getAttributeByName(attribute) : null;
        }
        if (object.startsWith('?')) {
            const condition = ScribeMechanicHandler.registry.condition.getMechanicByName(
                object.replace('?', '').replace('!', '').replace('~', '')
            );
            return condition ? condition.getAttributeByName(attribute) : null;
        }
        const mechanic = ScribeMechanicHandler.registry.mechanic.getMechanicByName(object);
        return mechanic ? mechanic.getAttributeByName(attribute) : null;
    }
    return null;
}

/**
 * Retrieves the cursor object based on the current position in the document.
 * It first attempts to fetch cursor skills, and if not found, it tries to fetch
 * an attribute linked to an object.
 *
 * @param registry - The registry containing the mechanics.
 * @param document - The text document where the cursor is located.
 * @param position - The position of the cursor in the document.
 * @returns The cursor object if found, otherwise null.
 */
export function getCursorObject(
    registry: AbstractScribeMechanicRegistry,
    document: vscode.TextDocument,
    position: vscode.Position
) {
    const maybeCondition = fetchCursorSkills(document, position, registry);
    if (maybeCondition) {
        return maybeCondition;
    }
    const maybeAttribute = document.getWordRangeAtPosition(position, /(?<=[{;])\w+/gm);
    if (maybeAttribute) {
        const object = getObjectLinkedToAttribute(document, position);
        if (!object) {
            return null;
        }
        const mechanic = registry.getMechanicByName(object);
        if (!mechanic) {
            return null;
        }
        const attribute = document.getText(maybeAttribute);
        return mechanic.getAttributeByName(attribute);
    }
    return null;
}
