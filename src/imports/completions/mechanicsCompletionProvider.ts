import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { keyAliases, Mechanic, ObjectInfo, ObjectType } from '../../objectInfos';


export function mechanicCompletionProvider(){
    const mechanicCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'yaml',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {
    
                if(!keyAliases["Skills"].includes(yamlutils.getParentKeys(document, position.line)[0])){
                    return undefined;
                }
    
                let space = " ";

                if (context.triggerCharacter === undefined){
                    const charBefore2 = document.getText(new vscode.Range(position.translate(0, -2), position));
                    if (charBefore2 !== "- ") {
                        return undefined;
                    }
                } else {
                    const specialSymbol = yamlutils.previousSpecialSymbol(document, position);
                    if (specialSymbol !== "-") {
                        return undefined;
                    }    
                }
    
    
                if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter && context.triggerCharacter === " ") {
                    space = "";
                }
    
                if (context.triggerCharacter === undefined) {
                    const charBefore = document.getText(new vscode.Range(position.translate(0, -1), position));
                    if (charBefore == '-') {
                        space = " ";
                    }
                    else {
                        space = "";
                    }
                }
    
                const completionItems: vscode.CompletionItem[] = [];
    
    
                ObjectInfo[ObjectType.MECHANIC].dataset.forEach((item: Mechanic) => {
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

    return mechanicCompletionProvider;
    
}
