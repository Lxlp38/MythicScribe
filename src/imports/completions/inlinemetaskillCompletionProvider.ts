import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { keyAliases } from '../../objectInfos';


export function inlineMetaskillCompletionProvider(){

    const inlineMetaskillCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'yaml',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
    
                const keys = yamlutils.getParentKeys(document, position.line);
                if (!keyAliases["Skills"].includes(keys[0])) {
                    return undefined;
                }
    
                const lastTwoChars = document.getText(new vscode.Range(position.translate(0, -2), position));
                if (lastTwoChars !== "=[") {
                    return undefined;
                }
                
                const indent = 2 //document.lineAt(position.line).firstNonWhitespaceCharacterIndex + 0;
                const indentation = " ".repeat(indent);
    
    
                const completionItem = new vscode.CompletionItem("Inline Metaskill", vscode.CompletionItemKind.Function);
                completionItem.detail = "Generate the syntax for an inline metaskill";
                completionItem.kind = vscode.CompletionItemKind.Function;
                completionItem.insertText = new vscode.SnippetString("\n" + indentation + "- $0\n" + indentation);
                completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
    
                return [completionItem];
            }
        }, "["
    );
    
    return inlineMetaskillCompletionProvider;

}
