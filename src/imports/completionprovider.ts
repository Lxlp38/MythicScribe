import * as vscode from 'vscode';
import * as yamlutils from './yamlutils';
import { mechanicsDataset, targetersDataset, conditionsDataset, ObjectType, ObjectInfo } from '../objectInfos';
import { getAllAttributes, getMechanicDataByName } from './mechanicutils';
import { getObjectLinkedToAttribute } from './cursorutils';

// Register the completion provider for a specific language (e.g., 'yaml')
export const mechanicsCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',  // The language to provide autocompletion for
    {
        // Method that returns autocompletion items
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (context.triggerCharacter === undefined) {
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

export const attributeCompletionProvider = vscode.languages.registerCompletionItemProvider(
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