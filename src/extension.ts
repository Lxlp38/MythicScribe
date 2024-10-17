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
	INLINECONDITION = 'Inline Condition',
}

const mechanicsDatasetPath = path.join(__dirname, '../data/MythicMobs_Mechanics_dataset.json');
const mechanicsDataset = JSON.parse(fs.readFileSync(mechanicsDatasetPath, 'utf8'));

const targetersDatasetPath = path.join(__dirname, '../data/MythicMobs_Targeters_dataset.json');
const targetersDataset = JSON.parse(fs.readFileSync(targetersDatasetPath, 'utf8'));

const conditionsDatasetPath = path.join(__dirname, '../data/MythicMobs_Conditions_dataset.json');
const conditionsDataset = JSON.parse(fs.readFileSync(conditionsDatasetPath, 'utf8'));


const ObjectInfo = {
	[ObjectType.MECHANIC]: {
		dataset: mechanicsDataset,
		regex: /(?<=\s- )[\w:]+(?=[\s{])/gm,
	},
	[ObjectType.ATTRIBUTE]: {
		dataset: mechanicsDataset,
		regex: /(?<=[{;])\w+(?==)/gm,
	},
	[ObjectType.TARGETER]: {
		dataset: targetersDataset,
		regex: /(?<=\s@)[\w:]+/gm,
	},
	[ObjectType.CONDITION]: {
		dataset: conditionsDataset,
		regex: /(?<=\s[-\(\|\&)] )[\w:]+(?=[\s{])/gm,
	},
	[ObjectType.INLINECONDITION]: {
		dataset: conditionsDataset,
		regex: /(?<=\s(\?)|(\?!)|(\?~)|(\?~!))[\w:]+/gm,
	},
}




// Utility to get mechanic data by name
function getMechanicDataByName(name: string, dataset = mechanicsDataset) {
	return dataset.find((mechanic: any) => mechanic.name.includes(name.toLowerCase()));
}

// Utility to get all mechanics that have a name that starts with a certain string
function getMechanicsByPrefix(prefix: string, dataset = mechanicsDataset) {
	return dataset.filter((mechanic: any) => mechanic.name.some((name: string) => name.startsWith(prefix.toLowerCase())));
}

// Utility to get mechanic data by class
function getMechanicDataByClass(name: string, dataset = mechanicsDataset) {
	return dataset.find((mechanic: any) => mechanic.class === name);
}

function getAllAttributes(mechanic: any, dataset = mechanicsDataset) {
	let attributes = mechanic.attributes;
	if (mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, dataset);
		if (!parentMechanic) {
			return attributes;
		}
		attributes = attributes.concat(getAllAttributes(parentMechanic));
	}
	console.log(attributes);
	return attributes;

}

// Utility to get attribute data by name
function getAttributeDataByName(mechanic: any, attributeName: string, dataset: any = mechanicsDataset) {
	var attribute = mechanic.attributes.find((attr: any) => attr.name.includes(attributeName.toLowerCase()));
	if (!attribute && mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, dataset);
		return getInheritedAttributeDataByName(parentMechanic, attributeName, dataset);
	}
	return attribute;
}
function getInheritedAttributeDataByName(mechanic: any, attributeName: string, dataset: any) {

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
		const parentMechanic = getMechanicDataByClass(mechanic.extends, dataset);
		if (parentMechanic) {
			return getInheritedAttributeDataByName(parentMechanic, attributeName, dataset);
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
				const objectMatch = textBeforeBrace.match(/(?<= )([@~]|(\?~?!?))?\w+$/);  // Match the last word before the brace
				if (objectMatch && objectMatch[0]) {
					return objectMatch[0];  // Return the object name
				}

				return null;  // No object found before '{'
			}
		}
	}

	return null;  // No unbalanced opening brace found
}

function fetchCursorSkills(document: vscode.TextDocument, position: vscode.Position, type: ObjectType, exact: boolean = true) {
	const maybeMechanic = document.getWordRangeAtPosition(position, ObjectInfo[type].regex);
	if (maybeMechanic) {
		const mechanic = document.getText(maybeMechanic);
		if (exact) {
			return [getMechanicDataByName(mechanic, ObjectInfo[type].dataset), type];
		}
		return [getMechanicsByPrefix(mechanic, ObjectInfo[type]), type];
	}
	return null;

}

function getCursorSkills(document: vscode.TextDocument, position: vscode.Position, exact: boolean = true) {
	const maybeMechanic = fetchCursorSkills(document, position, ObjectType.MECHANIC, exact);
	console.log(maybeMechanic);
	if (maybeMechanic) {
		return maybeMechanic;
	}

	const maybeTargeter = fetchCursorSkills(document, position, ObjectType.TARGETER, exact);
	if (maybeTargeter) {
		return maybeTargeter;
	}

	// const maybeCondition = fetchCursorSkills(document, position, ObjectType.CONDITION, exact);
	// if (maybeCondition) {
	// 	return maybeCondition;
	// }

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
			const targeter = getMechanicDataByName(object.replace("@", ""), targetersDataset);
			return [getAttributeDataByName(targeter, attribute, targetersDataset), ObjectType.ATTRIBUTE];
		}
		else if (object?.startsWith('~')) {
			return null
		}
		else if (object?.startsWith('?')) {
			const condition = getMechanicDataByName(object.replace("?", "").replace("!", "").replace("~", ""), conditionsDataset);
			return [getAttributeDataByName(condition, attribute, conditionsDataset), ObjectType.ATTRIBUTE];
		}
		const mechanic = getMechanicDataByName(object, mechanicsDataset);
		return [getAttributeDataByName(mechanic, attribute), ObjectType.ATTRIBUTE];

	}
}

async function getHover(mechanic: any, type: ObjectType): Promise<vscode.Hover> {
	if (type == ObjectType.ATTRIBUTE) {
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
## [Attribute](${attribute.link})
### [\`${attributeNames}\`](${attribute.link})

#### Type \`${attribute.type}\`
#### Default \`${attribute.default_value}\`
### Description\n\n${attribute.description}
`);

	// Enable support for links
	hoverContent.isTrusted = true;

	// Return a new hover with the formatted content
	return new vscode.Hover(hoverContent);
}


export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "mythicscribe" is now active!');

	// const disposable = vscode.commands.registerCommand('mythicscribe.helloWorld', () => {
	// 	vscode.window.showInformationMessage('Hello World from MythicScribe!');
	// });

	// context.subscriptions.push(disposable);


	// Hover provider for mechanics and attributes
	const hoverProvider = vscode.languages.registerHoverProvider('yaml', {
		provideHover(document: vscode.TextDocument, position: vscode.Position) {

			var obj, type = null;
			const keys = yamlutils.getParentKeys(document, position.line);

			switch (keys[0]) {
				case 'Skills':

					[obj, type] = getCursorSkills(document, position);
					console.log(obj);

					if (!obj) {
						return null;
					}

					return getHover(obj, type);

			}


			return null;
		}
	});

	// Register the providers
	context.subscriptions.push(hoverProvider);


	// Register the completion provider for a specific language (e.g., 'yaml')
	const mechanicsCompletionProvider = vscode.languages.registerCompletionItemProvider(
		'yaml',  // The language to provide autocompletion for
		{
			// Method that returns autocompletion items
			async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

				if(context.triggerCharacter === undefined){
					return undefined;
				}

				let space = " ";

				if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter && context.triggerCharacter === " ") {
					const charBefore = document.getText(new vscode.Range(position.translate(0, -2), position));
					if (charBefore != '- ') {
						return undefined;
					}
					space = "";
				}

				const keys = yamlutils.getParentKeys(document, position.line);
				const completionItems: vscode.CompletionItem[] = [];


				switch (keys[0]) {
					case 'Skills':
						mechanicsDataset.forEach((item: any) => {
							item.name.forEach((name: string) => {
								const completionItem = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
								completionItem.detail = `${item.description}`;
								completionItem.kind = vscode.CompletionItemKind.Function;
								if (!item.attributes && item.extends != "SkillMechanic") {
									completionItem.insertText = new vscode.SnippetString(space + name);
								}
								else {
									completionItem.insertText = new vscode.SnippetString(space + name + "{$0}");
								}
								completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
								completionItems.push(completionItem);

							});
						});

						return completionItems;

				}

			}
		}, "-", " "
	);

	const attributeCompletionProvider = vscode.languages.registerCompletionItemProvider(
		'yaml',
		{
			async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

				console.log("Trigger Kind for Attribute: " + context.triggerKind);
				const completionItems: vscode.CompletionItem[] = [];
				let mechanic = null;
				let type = ObjectType.MECHANIC;


				const object = getObjectLinkedToAttribute(document, position);
				console.log(object);
				if (!object) {
					return null;
				}
				else if (object?.startsWith('@')) {
					mechanic = getMechanicDataByName(object.replace("@", ""), targetersDataset);
					type = ObjectType.TARGETER;
				}
				else if (object?.startsWith('~')) {
					return null
				}
				else if (object?.startsWith('?')) {
					mechanic = getMechanicDataByName(object.replace("?", "").replace("!", "").replace("~", ""), conditionsDataset);
					type = ObjectType.CONDITION;
				}
				else {
					mechanic = getMechanicDataByName(object, mechanicsDataset);
					type = ObjectType.MECHANIC;
				}
			
				if (!mechanic) {
					return null;
				}

				const attributes = getAllAttributes(mechanic, ObjectInfo[type].dataset);
				let index = 10000;

				attributes.forEach((attribute: any) => {
					attribute.name.forEach((name: string) => {
						const completionItem = new vscode.CompletionItem(name, vscode.CompletionItemKind.Field);
						completionItem.detail = `${attribute.description}`;
						completionItem.kind = vscode.CompletionItemKind.Field;
						completionItem.insertText = new vscode.SnippetString(name + "=");
						completionItem.sortText = index.toString();
						index++;
						completionItems.push(completionItem);
					});
				});

				return completionItems
			}
		}, "{", ";"
	);

	// Register the provider
	context.subscriptions.push(mechanicsCompletionProvider);
	context.subscriptions.push(attributeCompletionProvider);


}

// This method is called when your extension is deactivated
export function deactivate() { }








// function getMechanicDataInLine(line: string) {
// 	const regex = /(?<=- )\w+(?=[\s{])/;
// 	const maybeMechanic = line.match(regex);  // Use match directly on the line text
// 	return maybeMechanic ? getMechanicDataByName(maybeMechanic[0]) : null;
// }
