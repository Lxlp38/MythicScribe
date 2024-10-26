import * as vscode from 'vscode';
import { getAttributeDataByName, getMechanicDataByName, getMechanicsByPrefix } from './mechanicutils';
import { ObjectInfo, ObjectType } from '../../objectInfos';

/**
 * Function to find the object linked to an unbalanced '{' in the format object{attribute1=value1;attribute2=value2}
 * @param document - The TextDocument in which you're searching
 * @param position - The Position of the attribute in the text
 * @returns The object linked to the attribute, or null if no object is found
 */
export function getObjectLinkedToAttribute(document: vscode.TextDocument, position: vscode.Position): string | null {
	// Get the text from the beginning of the document to the current position
	const textBeforeAttribute = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

	let openBraceCount = 0;

	// Traverse backwards through the text before the position
	for (let i = textBeforeAttribute.length - 1; i >= 0; i--) {
		const char = textBeforeAttribute[i];

		if (char === '}') {
			openBraceCount++;
		} else if (char === '{') {
			openBraceCount--;
			// If the brace count becomes negative, we've found an unbalanced opening '{'
			if (openBraceCount < 0) {
				// Get the text before the '{' which should be the object
				const textBeforeBrace = textBeforeAttribute.substring(0, i).trim();

				// Use a regex to find the object name before the '{'
				const objectMatch = textBeforeBrace.match(/(?<= )([@~]|(\?~?!?))?[\w:]+$/);  // Match the last word before the brace
				if (objectMatch && objectMatch[0]) {
					return objectMatch[0];  // Return the object name
				}

				return null;  // No object found before '{'
			}
		}
		else if (char === '[' || char === ']') {
			return null;
		}
	}

	return null;  // No unbalanced opening brace found
}

export function fetchCursorSkills(document: vscode.TextDocument, position: vscode.Position, type: ObjectType, exact: boolean = true) {
	const maybeMechanic = document.getWordRangeAtPosition(position, ObjectInfo[type].regex);
	if (maybeMechanic) {
		const mechanic = document.getText(maybeMechanic);
		if (exact) {
			return [getMechanicDataByName(mechanic, type), type];
		}
		return [getMechanicsByPrefix(mechanic, type), type];
	}
	return null;

}

export function getCursorSkills(document: vscode.TextDocument, position: vscode.Position, exact: boolean = true) {
	const maybeMechanic = fetchCursorSkills(document, position, ObjectType.MECHANIC, exact);
	if (maybeMechanic) {
		return maybeMechanic;
	}

	const maybeTargeter = fetchCursorSkills(document, position, ObjectType.TARGETER, exact);
	if (maybeTargeter) {
		return maybeTargeter;
	}

	const maybeTrigger = fetchCursorSkills(document, position, ObjectType.TRIGGER, exact);
	if (maybeTrigger) {
		return maybeTrigger;
	}

	const maybeInlineCondition = fetchCursorSkills(document, position, ObjectType.INLINECONDITION, exact);
	if (maybeInlineCondition) {
		return maybeInlineCondition;
	}

	const maybeAttribute = document.getWordRangeAtPosition(position, /(?<=[{;])\w+/gm);
	if (maybeAttribute) {
		const attribute = document.getText(maybeAttribute);
		const object = getObjectLinkedToAttribute(document, position);
		if (!object) {
			return null;
		}
		else if (object?.startsWith('@')) {
			const targeter = getMechanicDataByName(object.replace("@", ""), ObjectType.TARGETER);
			return [getAttributeDataByName(targeter, attribute, ObjectType.TARGETER), ObjectType.ATTRIBUTE];
		}
		else if (object?.startsWith('~')) {
			return null;
		}
		else if (object?.startsWith('?')) {
			const condition = getMechanicDataByName(object.replace("?", "").replace("!", "").replace("~", ""), ObjectType.CONDITION);
			return [getAttributeDataByName(condition, attribute, ObjectType.CONDITION), ObjectType.ATTRIBUTE];
		}
		const mechanic = getMechanicDataByName(object, ObjectType.MECHANIC);
		return [getAttributeDataByName(mechanic, attribute, ObjectType.MECHANIC), ObjectType.ATTRIBUTE];

	}
}


export function getCursorCondition(document: vscode.TextDocument, position: vscode.Position, exact: boolean = true) {
	const maybeCondition = fetchCursorSkills(document, position, ObjectType.CONDITION, exact);
	if (maybeCondition) {
		return maybeCondition;
	}

	const maybeAttribute = document.getWordRangeAtPosition(position, /(?<=[{;])\w+/gm);
	if (maybeAttribute) {
		const attribute = document.getText(maybeAttribute);
		const object = getObjectLinkedToAttribute(document, position);
		if (!object) {
			return null;
		}
		const mechanic = getMechanicDataByName(object, ObjectType.CONDITION);
		return [getAttributeDataByName(mechanic, attribute, ObjectType.CONDITION), ObjectType.ATTRIBUTE];

	}
	return null;
}