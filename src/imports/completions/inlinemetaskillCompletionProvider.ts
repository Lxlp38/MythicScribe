import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { isEnabled } from '../utils/configutils';

export const inlineMetaskillCompletionProvider = vscode.languages.registerCompletionItemProvider(
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

            const lastTwoChars = document.getText(new vscode.Range(position.translate(0, -2), position));
            if (lastTwoChars !== "=[") {
                return undefined;
            }
            
            const indent = 2 //document.lineAt(position.line).firstNonWhitespaceCharacterIndex + 0;
            const indentation = " ".repeat(indent);
            console.log(indent);


            const completionItem = new vscode.CompletionItem("Inline Metaskill", vscode.CompletionItemKind.Function);
            completionItem.detail = "Generate the syntax for an inline metaskill";
            completionItem.kind = vscode.CompletionItemKind.Function;
            completionItem.insertText = new vscode.SnippetString("\n" + indentation + "- $0\n" + indentation);
            completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };

            return [completionItem];
        }
    }, "["
);
