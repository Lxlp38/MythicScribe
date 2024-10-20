import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { mechanicsDataset, targetersDataset, conditionsDataset, ObjectType, ObjectInfo, ConditionActions, SkillFileObjects } from '../../objectInfos';
import { getAllAttributes, getMechanicDataByName } from '../utils/mechanicutils';
import { getObjectLinkedToAttribute } from '../utils/cursorutils';
import { isEnabled } from '../utils/configutils';



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
            if (!["?", "!", "~"].includes(charBefore0)) {
                return undefined;
            }
            const keys = yamlutils.getParentKeys(document, position.line);
            if (keys[0] !== 'Skills') {
                return undefined;
            }


            const completionItems: vscode.CompletionItem[] = [];

            switch (charBefore0) {
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