import * as vscode from 'vscode';
import { previousSymbol } from './yamlutils';
import { Mechanic, MechanicDataset } from '../../objectInfos';

export function checkShouldComplete(document: vscode.TextDocument, position: vscode.Position, context: vscode.CompletionContext, symbol: string[]): boolean {

    // called via invocation
    if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
        const mypreviousSpecialSymbol = previousSymbol(document, position);
        if (symbol.includes(mypreviousSpecialSymbol)) {
            return true;
        }
        return false;
    }

    // called via trigger character
    const charBefore0 = document.getText(new vscode.Range(position.translate(0, -1), position));
    if (symbol.includes(charBefore0)) {
        return true;
    }
    return false

}

export function addMechanicCompletions(target: MechanicDataset, completionItems: vscode.CompletionItem[]) {

    target.forEach((item: Mechanic) => {
        item.name.forEach((name: string) => {
            const completionItem = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
            completionItem.detail = `${item.description}`;
            completionItem.kind = vscode.CompletionItemKind.Function;
            completionItem.insertText = new vscode.SnippetString(name + "{$0}");
            completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
            completionItems.push(completionItem);
        });

    });


}