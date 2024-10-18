import * as vscode from 'vscode';
import * as yamlutils from './yamlutils';
import { mechanicsDataset, targetersDataset, conditionsDataset, ObjectType, ObjectInfo } from '../objectInfos';
import { getAllAttributes, getMechanicDataByName } from './mechanicutils';
import { getObjectLinkedToAttribute } from './cursorutils';
import { isEnabled } from './configutils';

export const mechanicsCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (isEnabled(document) === false) {
                return undefined;
            }

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

export const targeterCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if(context.triggerCharacter === undefined){
                return undefined;
            }

            if (isEnabled(document) === false) {
                return undefined;
            }

            const keys = yamlutils.getParentKeys(document, position.line);
            if (keys[0] !== 'Skills') {
                return undefined;
            }

            const completionItems: vscode.CompletionItem[] = [];

            targetersDataset.forEach((item: any) => {
                item.name.forEach((name: string) => {
                    const completionItem = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
                    completionItem.detail = `${item.description}`;
                    completionItem.kind = vscode.CompletionItemKind.Function;
                    completionItem.insertText = new vscode.SnippetString(name + "{$0}");
                    completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                    completionItems.push(completionItem);
                });
            });

            return completionItems;
        }
    }, "@"
);


export const inlineConditionCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (isEnabled(document) === false) {
                return undefined;
            }

            let charBefore0 = document.getText(new vscode.Range(position.translate(0, -1), position));
            if (charBefore0 === '{') {
                return undefined;
            }



            const keys = yamlutils.getParentKeys(document, position.line);
            if (keys[0] !== 'Skills') {
                return undefined;
            }


            const completionItems: vscode.CompletionItem[] = [];

            switch (context.triggerCharacter) {
                case "?":
                    let charBefore = document.getText(new vscode.Range(position.translate(0, -2), position));
                    if (charBefore !== ' ?') {
                        return undefined;
                    }

                    ["~", "~!", "!"].forEach((item: string) => {
                        let completionItem = new vscode.CompletionItem(item, vscode.CompletionItemKind.Function);
                        completionItem.kind = vscode.CompletionItemKind.Function;
                        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                        completionItem.sortText = "0";
                        completionItems.push(completionItem);
                    });
                    break;
                case "~":
                    let charBefore2 = document.getText(new vscode.Range(position.translate(0, -3), position));
                    if (charBefore2 !== " ?~") {
                        return undefined;
                    }
                    let completionItem = new vscode.CompletionItem("!", vscode.CompletionItemKind.Function);
                    completionItem.kind = vscode.CompletionItemKind.Function;
                    completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                    completionItem.sortText = "0";
                    completionItems.push(completionItem);
                    break;
                case "!":
                    let charBefore3 = document.getText(new vscode.Range(position.translate(0, -3), position));
                    if (charBefore3 !== " ?!" && charBefore3 !== "?~!") {
                        return undefined;
                    }
                    break;
            }



            conditionsDataset.forEach((item: any) => {
                item.name.forEach((name: string) => {
                    const completionItem = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
                    completionItem.detail = `${item.description}`;
                    completionItem.kind = vscode.CompletionItemKind.Function;
                    completionItem.insertText = new vscode.SnippetString(name + "{$0}");
                    completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                    completionItems.push(completionItem);
                });
            });

            return completionItems;
        }
    }, "?", "!", "~"
);


export const attributeCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (isEnabled(document) === false) {
                return undefined;
            }

            const completionItems: vscode.CompletionItem[] = [];
            let mechanic = null;
            let type = ObjectType.MECHANIC;


            const object = getObjectLinkedToAttribute(document, position);
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
                let mainname = attribute.name.reduce((a: string, b: string) => a.length < b.length ? a : b);
                let aliases = [mainname];
                attribute.name.forEach((name: string) => {
                    if (name !== mainname) {
                        aliases.push(name);
                    }
                });
                const completionItem = new vscode.CompletionItem(mainname, vscode.CompletionItemKind.Field);
                completionItem.label = `${aliases.join(", ")}`;
                completionItem.detail = `${attribute.description}`;
                completionItem.kind = vscode.CompletionItemKind.Field;
                completionItem.insertText = new vscode.SnippetString(mainname + "=");
                completionItem.sortText = index.toString();
                index++;
                completionItems.push(completionItem);
            });

            return completionItems
        }
    }, "{", ";"
);