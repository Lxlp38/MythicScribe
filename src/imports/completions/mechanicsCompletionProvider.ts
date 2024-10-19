import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { mechanicsDataset } from '../../objectInfos';
import { isEnabled } from '../utils/configutils';

export const mechanicCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {


            if (isEnabled(document) === false) {
                return undefined;
            }


            if(yamlutils.getParentKeys(document, position.line)[0] !== 'Skills'){
                return undefined;
            }

            let space = " ";

            const charBefore = document.getText(new vscode.Range(position.translate(0, -2), position));
            if (charBefore != '- ') {
                return undefined;
            }

            if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter && context.triggerCharacter === " ") {
                space = "";
            }

            if (context.triggerCharacter === undefined) {
                space = "";
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
