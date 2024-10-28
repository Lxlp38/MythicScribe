import * as vscode from 'vscode';
import { previousSymbol } from './yamlutils';

export function checkShouldComplete(document: vscode.TextDocument, position: vscode.Position, context: vscode.CompletionContext, symbol: string[]): boolean {

    // called via invocation
    if(context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
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