import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { mechanicsDataset, targetersDataset, conditionsDataset, ObjectType, ObjectInfo, ConditionActions, SkillFileObjects } from '../../objectInfos';
import { getAllAttributes, getMechanicDataByName } from '../utils/mechanicutils';
import { getObjectLinkedToAttribute } from '../utils/cursorutils';
import { isEnabled } from '../utils/configutils';
import { isMetaskillFile, enableDashesSuggestions } from '../utils/configutils';

export const SkillFileCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (!isEnabled(document) || !isMetaskillFile(document)) {
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

            // if (context.triggerCharacter != undefined) {
            //     const previousLine = document.lineAt(position.line - 1).text;
            //     const shouldDeletePreviousLine = ["-",""].includes(previousLine.trim());
            //     if (shouldDeletePreviousLine) {
            //         const range = new vscode.Range(position.line - 1, 0, position.line - 1, previousLine.length);
            //         const edit = new vscode.WorkspaceEdit();
            //         edit.replace(document.uri, range, " ".repeat(previousLine.length));
            //         await vscode.workspace.applyEdit(edit);
            //         return undefined;
            //     }    
            // }

            if(keys.length == 0){
                return undefined;
            }
            else if(keys.length == 2){
                if(enableDashesSuggestions() && SkillFileObjects[keys[0] as keyof typeof SkillFileObjects].type == "list"){
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

            Object.entries(SkillFileObjects).forEach(([key, value]) => {
                const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
                completionItem.kind = vscode.CompletionItemKind.File;
                if(value.type == "list"){
                    completionItem.insertText = new vscode.SnippetString(indentation + key + ":\n" + indentation + "- $0");
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
