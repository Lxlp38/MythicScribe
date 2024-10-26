import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { keyAliases, ObjectInfo, ObjectType } from '../../objectInfos';


export function triggerfileCompletionProvider(){
    const triggerfileCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'yaml',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
        
                const keys = yamlutils.getParentKeys(document, position.line);
                if (!keyAliases["Skills"].includes(keys[0])) {
                    return undefined;
                }
    
                const charBefore0 = document.getText(new vscode.Range(position.translate(0, -1), position));
                if (charBefore0 != '~') {
                    return undefined;
                }
    
                const completionItems: vscode.CompletionItem[] = [];
    
                ObjectInfo[ObjectType.TRIGGER].dataset.forEach((item: any) => {
                    item.name.forEach((name: string) => {
                        const completionItem = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
                        completionItem.detail = `${item.description}`;
                        completionItem.kind = vscode.CompletionItemKind.Function;
                        completionItem.insertText = new vscode.SnippetString(name + " $0");
                        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                        completionItems.push(completionItem);
                    });
                });
    
                return completionItems;
            }
        }, "~"
    );    

    return triggerfileCompletionProvider;
}
