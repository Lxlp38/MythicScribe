import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { mechanicsDataset, targetersDataset, conditionsDataset, ObjectType, ObjectInfo, ConditionActions, SkillFileObjects } from '../../objectInfos';
import { getAllAttributes, getMechanicDataByName } from '../utils/mechanicutils';
import { getObjectLinkedToAttribute } from '../utils/cursorutils';
import { isEnabled } from '../utils/configutils';

export const targeterCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            // if(context.triggerCharacter === undefined){
            //     return undefined;
            // }

            if (isEnabled(document) === false) {
                return undefined;
            }

            const keys = yamlutils.getParentKeys(document, position.line);
            if (keys[0] !== 'Skills') {
                return undefined;
            }

            const charBefore = document.getText(new vscode.Range(position.translate(0, -1), position));
            if (charBefore != '@') {
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
