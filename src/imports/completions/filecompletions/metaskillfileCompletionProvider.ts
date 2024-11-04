import * as vscode from 'vscode';
import * as yamlutils from '../../utils/yamlutils';
import { FileObjectTypes, MetaskillFileObjects } from '../../../objectInfos';
import { enableFileSpecificSuggestions, isEnabled, isMetaskillFile } from '../../utils/configutils';

export function metaskillFileCompletionProvider(){
    const SkillFileCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'yaml',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
    
                if (enableFileSpecificSuggestions() === false) {
                    return undefined;
                }
    
                if (!/^\s*$/.test(document.lineAt(position.line).text)) {
                    return undefined;
                }
    
                const keys = yamlutils.getParentKeys(document, position.line);
                const completionItems: vscode.CompletionItem[] = [];
                const indentnow = document.lineAt(position.line).firstNonWhitespaceCharacterIndex;
                const indentpre = document.lineAt(position.line - 1).firstNonWhitespaceCharacterIndex;
                let indentation = " ".repeat(indentpre - indentnow);
    
                if(keys.length == 0){
                    return undefined;
                }
                else if(keys.length == 2){
                    if(MetaskillFileObjects[keys[0] as keyof typeof MetaskillFileObjects].type == "list"){
                        const completionItem = new vscode.CompletionItem("-", vscode.CompletionItemKind.Snippet);
                        completionItem.insertText = new vscode.SnippetString(indentation + "- $0");
                        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                        completionItems.push(completionItem);
                    }
                }
                else if(keys.length > 2){
                    return undefined;
                }
                else{
                    indentation = indentation + "  ";
                }
    
                Object.entries(MetaskillFileObjects).forEach(([key, value]) => {
                    const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
                    completionItem.kind = vscode.CompletionItemKind.File;
                    if(value.type == FileObjectTypes.LIST){
                        completionItem.insertText = new vscode.SnippetString(indentation + key + ":\n" + indentation + "- $0");
                    }
                    else if (value.type == FileObjectTypes.BOOLEAN) {
                        completionItem.insertText = new vscode.SnippetString(indentation + key + ": ${1|true,false|}");
                    }
                    else {
                        completionItem.insertText = new vscode.SnippetString(indentation + key + ": $0");
                    }
                    completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                    completionItems.push(completionItem);
                });
                
                return completionItems;
            }
        }, "\n"
    );
    
    return SkillFileCompletionProvider;

}

