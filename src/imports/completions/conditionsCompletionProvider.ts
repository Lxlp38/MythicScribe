import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { conditionsDataset, ConditionActions, keyAliases } from '../../objectInfos';
import { isEnabled } from '../utils/configutils';

export const conditionCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (isEnabled(document) === false) {
                return undefined;
            }

            const keys = yamlutils.getParentKeys(document, position.line);
            if (!keyAliases["Conditions"].includes(keys[0])) {
                return undefined;
            }

            const charBefore = document.getText(new vscode.Range(position.translate(0, -2), position));
            if (charBefore[1] === "{") {
                return undefined;
            }

            let space = " ";

            const completionItems: vscode.CompletionItem[] = [];
            let conditionAction = null
            const lastIsConditionAction = Object.keys(ConditionActions).includes(yamlutils.getWordBeforePosition(document, position));
            if (lastIsConditionAction) {
                conditionAction = yamlutils.getWordBeforePosition(document, position);
                addOperatorsToConditionLine(completionItems);
                return completionItems;
            }

            if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter && context.triggerCharacter === " ") {
                if (!["- ", "( ", "| ", "& "].includes(charBefore)) {
                    if ([") ", "} "].includes(charBefore)) {

                        addOperatorsToConditionLine(completionItems);

                        addConditionActionsToConditionLine(completionItems);

                        return completionItems;
                    }
                    return undefined;
                }
                space = "";
            }
            if (context.triggerKind === vscode.CompletionTriggerKind.Invoke && context.triggerCharacter === undefined) {
                space = "";
            }



            const openBraceCompletion = new vscode.CompletionItem("(", vscode.CompletionItemKind.Function);
            openBraceCompletion.kind = vscode.CompletionItemKind.Function;
            openBraceCompletion.insertText = new vscode.SnippetString(space + "( $0 )");
            openBraceCompletion.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
            completionItems.push(openBraceCompletion);

            const openBraceCount = (document.getText().match(/\(/g) || []).length;
            const closeBraceCount = (document.getText().match(/\)/g) || []).length;
            if (openBraceCount > closeBraceCount) {
                const closeBraceCompletion = new vscode.CompletionItem(")", vscode.CompletionItemKind.Function);
                closeBraceCompletion.kind = vscode.CompletionItemKind.Function;
                closeBraceCompletion.insertText = new vscode.SnippetString(") $0");
                closeBraceCompletion.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                completionItems.push(closeBraceCompletion);
            }


            conditionsDataset.forEach((item: any) => {
                item.name.forEach((name: string) => {
                    const completionItem = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
                    completionItem.detail = `${item.description}`;
                    completionItem.kind = vscode.CompletionItemKind.Function;
                    completionItem.insertText = new vscode.SnippetString(space + name + "{$0}");
                    completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                    completionItems.push(completionItem);
                });
            });

            return completionItems;
        }
    }, "-", " ", "(", "|", "&", ")"
);


function addOperatorsToConditionLine(completionItems : vscode.CompletionItem[]) {
    const completionItem1 = new vscode.CompletionItem("&&", vscode.CompletionItemKind.Function);
    completionItem1.kind = vscode.CompletionItemKind.Function;
    completionItem1.insertText = new vscode.SnippetString("&& $0");
    completionItem1.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
    const completionItem2 = new vscode.CompletionItem("||", vscode.CompletionItemKind.Function);
    completionItem2.kind = vscode.CompletionItemKind.Function;
    completionItem2.insertText = new vscode.SnippetString("|| $0");
    completionItem2.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
    completionItems.push(completionItem1);
    completionItems.push(completionItem2);

}

function addConditionActionsToConditionLine(completionItems : vscode.CompletionItem[]) {
    Object.keys(ConditionActions).forEach((key: string) => {
        let completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.Function);
        completionItem.kind = vscode.CompletionItemKind.Function;
        completionItem.insertText = new vscode.SnippetString(key + " $0");
        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
        completionItems.push(completionItem);
    });    
}