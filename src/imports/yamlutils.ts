import * as vscode from 'vscode';

function getUpstreamKey(document: vscode.TextDocument, lineIndex: number): string {
	for (let i = lineIndex; i >= 0; i--) {
		const line = document.lineAt(i).text.trim();
		if (line.match(/^[A-Za-z0-9_]+:/)) {
			return line.split(':')[0];
		}
	}
	return '';
}
function getParentKeys(document: vscode.TextDocument, lineIndex: number): string[] {
    const keys: string[] = [];
    let currentIndent = getIndentation(document.lineAt(lineIndex).text);  // Get the indentation of the current line

	if (!isKey(document, lineIndex)) {
		currentIndent += 1;
	}

    for (let i = lineIndex; i >= 0; i--) {
        const line = document.lineAt(i).text.trim();
        if (line.match(/^[A-Za-z0-9_]+:/)) {
            const lineIndent = getIndentation(document.lineAt(i).text);  // Get the indentation of this line
            
            // If the line has a lower (less) indentation, it is a parent
            if (lineIndent < currentIndent) {
                keys.push(line.split(':')[0]);  // Add the key without the colon
                currentIndent = lineIndent;  // Update current indentation to this parent's level
            }
        }
    }
    return keys;
}

/**
 * Helper function to get the indentation level of a line
 * @param line - A line of YAML text
 * @returns The number of leading spaces (indentation level)
 */
function getIndentation(line: string): number {
    return line.length - line.trimStart().length;
}

/**
 * Function to determine if the current line is a key in the YAML file
 * @param document - The TextDocument of the YAML file
 * @param lineIndex - The index of the current line
 * @returns Whether the current line is a key
 */

function isKey(document: vscode.TextDocument, lineIndex: number): boolean {

	const line = document.lineAt(lineIndex).text.trim();
	// If we are inside a key, we're not inside the Skills section
	if (line.match(/^[A-Za-z0-9_]+:/)) {
		return true;
	}

	return false

}

/**
 * Function to determine if the current line is inside a specific key in the YAML file
 * @param document - The TextDocument of the YAML file
 * @param lineIndex - The index of the current line
 * @param key - The key to check for
 * @returns Whether the current line is inside the specified key
 */
function isInsideKey(document: vscode.TextDocument, lineIndex: number, key: string): boolean {

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
		if (line.match(/^[A-Za-z0-9_]+:/)) {
			return false;
		}
	}
	return false;
}

export { getUpstreamKey, getParentKeys, isKey, isInsideKey };