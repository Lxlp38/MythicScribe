// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { get } from 'http';
import * as yamlutils from './imports/yamlutils';
import { text } from 'stream/consumers';

enum ObjectType {
	MECHANIC = 'Mechanic',
	ATTRIBUTE = 'Attribute',
	TARGETER = 'Targeter',
	CONDITION = 'Condition',
}

const mechanicsDatasetPath = path.join(__dirname, '../data/MythicMobs_Mechanics_dataset.json');
const mechanicsDataset = JSON.parse(fs.readFileSync(mechanicsDatasetPath, 'utf8'));

// Utility to get mechanic data by name
function getMechanicDataByName(name: string) {
    return mechanicsDataset.find((mechanic: any) => mechanic.name.includes(name.toLowerCase()));
}

function getMechanicDataInLine(line: string) {
	const regex = /(?<=- )\w+(?=[\s{])/;
	const maybeMechanic = line.match(regex);  // Use match directly on the line text
	return maybeMechanic ? getMechanicDataByName(maybeMechanic[0]) : null;
}

// Utility to get mechanic data by class
function getMechanicDataByClass(name: string) {
	return mechanicsDataset.find((mechanic: any) => mechanic.class === name);
}

// Utility to get attribute data by name
function getAttributeDataByName(mechanic: any, attributeName: string) {
	var attribute = mechanic.attributes.find((attr: any) => attr.name.includes(attributeName.toLowerCase()));
	if (!attribute && mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends);
		return getInheritedAttributeDataByName(parentMechanic, attributeName);
	}
	return attribute;
}
function getInheritedAttributeDataByName(mechanic: any, attributeName: string) {

	var attribute = null;

	if (mechanic.inheritable_attributes) {
		if (mechanic.inheritable_attributes.includes(attributeName.toLowerCase())) {
			var attribute = mechanic.attributes.find((attr: any) => attr.name.includes(attributeName.toLowerCase()));
		}
	}
	else {
		var attribute = mechanic.attributes.find((attr: any) => attr.name.includes(attributeName.toLowerCase()));
	}

	if (!attribute && mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends);
		if (parentMechanic) {
			return getInheritedAttributeDataByName(parentMechanic, attributeName);
		}
	}
	return attribute;
}






/**
 * Function to find the object linked to an unbalanced '{' in the format object{attribute1=value1;attribute2=value2}
 * @param document - The TextDocument in which you're searching
 * @param position - The Position of the attribute in the text
 * @returns The object linked to the attribute, or null if no object is found
 */
function getObjectLinkedToAttribute(document: vscode.TextDocument, position: vscode.Position): string | null {
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
                const objectMatch = textBeforeBrace.match(/(?<= )[@~]?\w+$/);  // Match the last word before the brace
                if (objectMatch && objectMatch[0]) {
                    return objectMatch[0];  // Return the object name
                }

                return null;  // No object found before '{'
            }
        }
    }

    return null;  // No unbalanced opening brace found
}

function getCursorSkills(document: vscode.TextDocument, position: vscode.Position) {
	const maybeMechanic = document.getWordRangeAtPosition(position, /(?<=- )[\w:]+(?=[\s{])/)
	if (maybeMechanic) {
		const mechanic = document.getText(maybeMechanic);
		return getMechanicDataByName(mechanic);
	}

	const maybeAttribute = document.getWordRangeAtPosition(position, /(?<=[{;])\w+(?==)/);
	if (maybeAttribute) {
		const attribute = document.getText(maybeAttribute);
		const object = getObjectLinkedToAttribute(document, position);
		if (!object){
			return null;
		}
		else if (object?.startsWith('@')){
			return null
		}
		else if (object?.startsWith('~')){
			return null
		}
		const mechanic = getMechanicDataByName(object)
		return getAttributeDataByName(mechanic, attribute);
		
	}
}

function getHover(mechanic: any, type: ObjectType): vscode.Hover {
	if(type == ObjectType.ATTRIBUTE) {
		return getHoverForAttribute(mechanic);
	}

    // Combine the mechanic names into a comma-separated string for the mechanic's names
    const mechanicNames = mechanic.name.join(', ');

    // Start building the hover content for the mechanic
    let hoverContent = new vscode.MarkdownString(`
### [${type}](${mechanic.link})
[\`${mechanicNames}\`](${mechanic.link})


### Description
${mechanic.description}

---

`);

    // Check if there are any attributes to display in the table
    if (mechanic.attributes && mechanic.attributes.length > 0) {
        // Add headers for the attribute table
        hoverContent.appendMarkdown(`\n\n`);
        hoverContent.appendMarkdown(`
| **Name**        | **Aliases**    | **Description**                  | **Default**       | **Type**            |
|-----------------|----------------|----------------------------------|-------------------|---------------------|
`);

        // Add each attribute to the table
        mechanic.attributes.forEach((attribute: any) => {
            const attributeName = attribute.name[0]; // First element as the primary name
            const attributeAliases = attribute.name.slice(1).join(', ') || ''; // Remaining names as aliases
            const attributeDescription = attribute.description || 'No description provided.';
            const defaultValue = attribute.default_value || 'None'; // Assuming there's a defaultValue field
            const attributeType = attribute.type || ''; // Default to "Unknown" if type is missing

            // Append the attribute details as a row in the table
			hoverContent.appendMarkdown(`| ${attributeName ? `\`${attributeName}\`` : ''} | ${attributeAliases ? `\`${attributeAliases}\`` : ''} | ${attributeDescription ? attributeDescription : ''} | ${defaultValue ? `\`${defaultValue}\`` : ''} | ${attributeType ? `\`${attributeType}\`` : ''} |\n`);
        });
    }

	hoverContent.appendMarkdown(`\n\n[Get More Information By Visiting Its Wiki Page](${mechanic.link})`);

    // Enable support for links
    hoverContent.isTrusted = true;

    // Return the hover with the formatted content
    return new vscode.Hover(hoverContent);
	
}

/**
 * Function to return a Markdown hover for the given attribute
 * @param attribute - The attribute object containing name, type, description, and link
 * @returns A new Hover object with Markdown content
 */
function getHoverForAttribute(attribute: any): vscode.Hover {
    // Combine the names into a comma-separated string
    const attributeNames = attribute.name.join(', ');

    // Format the hover content using Markdown
    const hoverContent = new vscode.MarkdownString(`
## [Attribute \`${attributeNames}\`](${attribute.link})

#### Type \`${attribute.type}\`
#### Default \`${attribute.default_value}\`
### Description\n\n${attribute.description}
`);

    // Enable support for links
    hoverContent.isTrusted = true;

    // Return a new hover with the formatted content
    return new vscode.Hover(hoverContent);
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mythicscribe" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('mythicscribe.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from MythicScribe!');
	});

	context.subscriptions.push(disposable);


    // Hover provider for mechanics and attributes
    const hoverProvider = vscode.languages.registerHoverProvider('yaml', {
        provideHover(document: vscode.TextDocument, position: vscode.Position) {

			var obj = null;

			const keys = yamlutils.getParentKeys(document, position.line);

			switch (keys[0]) {
				case 'Skills':

				obj = getCursorSkills(document, position);
				console.log(obj);

				if (!obj) {
					return null;
				}

				return getHover(obj, ObjectType.MECHANIC);

			}


            return null;
        }
    });

    // Register the providers
    context.subscriptions.push(hoverProvider);

}

// This method is called when your extension is deactivated
export function deactivate() {}
