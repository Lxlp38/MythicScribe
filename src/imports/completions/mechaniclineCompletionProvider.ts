import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { isEnabled, isMetaskillFile } from '../utils/configutils';
import { getMechanicLine } from '../utils/yamlutils';

export const mechaniclineCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (isEnabled(document) === false) {
                return undefined;
            }

            const keys = yamlutils.getParentKeys(document, position.line);
            if (keys[0] !== 'Skills') {
                return undefined;
            }

            const charBefore = document.getText(new vscode.Range(position.translate(0, -1), position));
            if (charBefore != ' ') {
                return undefined;
            }


            const mechanicLine = getMechanicLine(document, position.line);
            if (mechanicLine.size === 0){
                return undefined;
            }

            const completionItems: vscode.CompletionItem[] = [];
            console.log(mechanicLine);

            const completionItem = new vscode.CompletionItem("?", vscode.CompletionItemKind.Function);
            completionItem.detail = "Add a condition to the mechanic line";
            completionItem.kind = vscode.CompletionItemKind.Function;
            completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
            completionItems.push(completionItem);

            if (mechanicLine.has("condition")){
                return completionItems;
            }


            if (!mechanicLine.has("targeter")){
                const completionItem = new vscode.CompletionItem("@", vscode.CompletionItemKind.Function);
                completionItem.detail = "Add a targeter to the mechanic line";
                completionItem.kind = vscode.CompletionItemKind.Function;
                completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                completionItems.push(completionItem);
            }

            if (!mechanicLine.has("trigger") && !isMetaskillFile(document)){
                const completionItem = new vscode.CompletionItem("~", vscode.CompletionItemKind.Function);
                completionItem.detail = "Add a trigger to the mechanic line";
                completionItem.kind = vscode.CompletionItemKind.Function;
                completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                completionItems.push(completionItem);
            }

            return completionItems
            
        }
    }, " "
)