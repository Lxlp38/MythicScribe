import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { ObjectInfo, ObjectType } from '../../objectInfos';


export function targeterCompletionProvider(){
    const targeterCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'yaml',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
    
                // if(context.triggerCharacter === undefined){
                //     return undefined;
                // }
    
                const keys = yamlutils.getParentKeys(document, position.line);
                if (keys[0] !== 'Skills') {
                    return undefined;
                }
    
                const specialSymbol = yamlutils.previousSpecialSymbol(document, position);
                if (specialSymbol != '@') {
                    return undefined;
                }
    
                const completionItems: vscode.CompletionItem[] = [];
    
                ObjectInfo[ObjectType.TARGETER].dataset.forEach((item: any) => {
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

    return targeterCompletionProvider;
}
