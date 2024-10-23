import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { keyAliases, mechanicsDataset } from '../../objectInfos';
import { isEnabled } from '../utils/configutils';

export const mechanicCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (isEnabled(document) === false) {
                return undefined;
            }

            if(!keyAliases["Skills"].includes(yamlutils.getParentKeys(document, position.line)[0])){
                return undefined;
            }

            let space = " ";

            const specialSymbol = yamlutils.previousSpecialSymbol(document, position);
            if (specialSymbol !== "-") {
                return undefined;
            }


            if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter && context.triggerCharacter === " ") {
                space = "";
            }

            if (context.triggerCharacter === undefined) {
                const charBefore = document.getText(new vscode.Range(position.translate(0, -1), position));
                if (charBefore == '-') {
                    space = " ";
                }
                else {
                    space = "";
                }
            }

            const completionItems: vscode.CompletionItem[] = [];


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
    }, "-", " "
);
