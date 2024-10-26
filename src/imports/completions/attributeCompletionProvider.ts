import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { ObjectType, ObjectInfo, keyAliases } from '../../objectInfos';
import { getAllAttributes, getMechanicDataByName } from '../utils/mechanicutils';
import { getObjectLinkedToAttribute } from '../utils/cursorutils';


export function attributeCompletionProvider(){
    const attributeCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'yaml',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
    
                const charBefore = document.getText(new vscode.Range(position.translate(0, -2), position));
                if (charBefore === ";;" || charBefore === "{;") {
                    const edit = new vscode.WorkspaceEdit();
                    edit.delete(document.uri, new vscode.Range(position.translate(0, -1), position));
                    await vscode.workspace.applyEdit(edit);
                    vscode.commands.executeCommand('editor.action.triggerSuggest');
                    return undefined;
                }
                else if (charBefore === "- ") {
                    return undefined;
                }
    
                if (context.triggerCharacter === undefined) {
                    const specialSymbol = yamlutils.previousSpecialSymbol(document, position);
                    if (!["{", ";"].includes(specialSymbol)) {
                        return undefined;
                    }    
                }
    
                const keys = yamlutils.getParentKeys(document, position.line);
                const completionItems: vscode.CompletionItem[] = [];
                let mechanic = null;
                let type = ObjectType.MECHANIC;
    
                const object = getObjectLinkedToAttribute(document, position);
                if (!object) {
                    return null;
                }
                else if (object?.startsWith('@')) {
                    mechanic = getMechanicDataByName(object.replace("@", ""), ObjectInfo[ObjectType.TARGETER].datasetMap);
                    type = ObjectType.TARGETER;
                }
                else if (object?.startsWith('~')) {
                    return null
                }
                else if (object?.startsWith('?')) {
                    mechanic = getMechanicDataByName(object.replace("?", "").replace("!", "").replace("~", ""), ObjectInfo[ObjectType.CONDITION].datasetMap);
                    type = ObjectType.INLINECONDITION;
                }
                else if (keyAliases["Conditions"].includes(keys[0])) {
                    mechanic = getMechanicDataByName(object, ObjectInfo[ObjectType.CONDITION].datasetMap);
                    type = ObjectType.CONDITION;
                }
                else {
                    mechanic = getMechanicDataByName(object, ObjectInfo[ObjectType.MECHANIC].datasetMap);
                    type = ObjectType.MECHANIC;
                }
    
                if (!mechanic) {
                    return null;
                }
    
                const attributes = getAllAttributes(mechanic, ObjectInfo[type].dataset);
                let index = 10000;
    
                attributes.forEach((attribute: any) => {
                    let mainname = attribute.name.reduce((a: string, b: string) => a.length < b.length ? a : b);
                    let aliases = [mainname];
                    attribute.name.forEach((name: string) => {
                        if (name !== mainname) {
                            aliases.push(name);
                        }
                    });
                    const completionItem = new vscode.CompletionItem(mainname, vscode.CompletionItemKind.Field);
                    completionItem.label = `${aliases.join(", ")}`;
                    completionItem.detail = `${attribute.description}`;
                    completionItem.kind = vscode.CompletionItemKind.Field;
                    completionItem.insertText = new vscode.SnippetString(mainname + "=");
                    completionItem.sortText = index.toString();
                    index++;
                    completionItems.push(completionItem);
                });
    
                return completionItems;
            }
        }, "{", ";"
    );
    return attributeCompletionProvider;
}

