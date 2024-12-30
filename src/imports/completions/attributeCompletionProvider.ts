import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { ObjectType, keyAliases, EnumInfo, ObjectInfo, Attribute, Mechanic, EnumDatasetValue } from '../../objectInfos';
import { getAllAttributes, getMechanicDataByName } from '../utils/mechanicutils';
import { getObjectLinkedToAttribute } from '../utils/cursorutils';
import { checkShouldComplete } from '../utils/completionhelper';
import { getAttributeAliasUsedInCompletions } from '../utils/configutils';


export function attributeCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {

                if (!checkShouldComplete(document, position, context, ["{", ";"])) {
                    return undefined;
                }

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
                
                const keys = yamlutils.getParentKeys(document, position);
                
                const result = searchForLinkedObject(document, position, keys);
                if (!result) {
                    return null;
                }
                const [mechanic, type] = result;

                const attributes = getAllAttributes(mechanic, type);
                let index = 10000;

                const attributeAliasUsedInCompletions = getAttributeAliasUsedInCompletions();

                const completionItems: vscode.CompletionItem[] = [];

                attributes.forEach((attribute: Attribute) => {
                    let mainname = attribute.name[0];
                    let aliases = attribute.name;

                    if (attributeAliasUsedInCompletions === "shorter") {
                        mainname = attribute.name.reduce((a: string, b: string) => a.length < b.length ? a : b);
                        aliases = [mainname];
                        attribute.name.forEach((name: string) => {
                            if (name !== mainname) {
                                aliases.push(name);
                            }
                        });
                    }

                    const attributeType = attribute.type;
                    const attributeEnum = attribute.enum ? attribute.enum.toUpperCase() : null;
                    const completionItem = new vscode.CompletionItem(mainname, vscode.CompletionItemKind.Field);
                    completionItem.label = `${aliases.join(", ")}`;
                    completionItem.detail = `${attribute.description}`;
                    completionItem.kind = vscode.CompletionItemKind.Field;


                    if (attributeType === "Boolean") {
                        completionItem.insertText = new vscode.SnippetString(mainname + "=" + "${1|true,false|}");
                    }
                    else if (attributeEnum && Object.keys(EnumInfo).includes(attributeEnum)) {
                        completionItem.insertText = new vscode.SnippetString(mainname + "=");
                        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                    }
                    else {
                        completionItem.insertText = new vscode.SnippetString(mainname + "=");
                    }
                    completionItem.sortText = index.toString();
                    index++;
                    completionItems.push(completionItem);
                });

                return completionItems;
            }
        }, "{", ";"
    );
}


export function attributeValueCompletionProvider() {
    const attributeValueCompletionProvider = vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

                if (!checkShouldComplete(document, position, context, ["=", ","])) {
                    return undefined;
                }

                const keys = yamlutils.getParentKeys(document, position);
                const completionItems: vscode.CompletionItem[] = [];

                const result = searchForLinkedObject(document, position, keys);
                if (!result) {
                    return null;
                }
                const [mechanic, type] = result;

                const attribute = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position)).match(ObjectInfo[ObjectType.ATTRIBUTE].regex)?.pop();

                if (!attribute) {
                    return null;
                }

                const attributeInfo = getAllAttributes(mechanic, type).find((attr: { name: string[]; }) => attr.name.includes(attribute));

                if (!attributeInfo) {
                    return null;
                }

                const charBefore0 = document.getText(new vscode.Range(position.translate(0, -1), position));

                const attributeType = attributeInfo.type;
                const attributeEnum = attributeInfo.enum ? attributeInfo.enum.toUpperCase() : null;
                const attributeList = attributeInfo.list;

                if (charBefore0 === ",") {
                    if (!attributeList) {
                        return undefined;
                    }
                }

                if (attributeType === "Boolean") {
                    completionItems.push(new vscode.CompletionItem("true", vscode.CompletionItemKind.Value));
                    completionItems.push(new vscode.CompletionItem("false", vscode.CompletionItemKind.Value));
                }
                else if (attributeEnum && Object.keys(EnumInfo).includes(attributeEnum)) {
                    Object.entries(EnumInfo[attributeEnum].dataset).forEach(([key, value]: [string, unknown]) => {
                        const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.Value);                        
                        if (isEnumDatasetValue(value)) {
                            completionItem.detail = `${(value as EnumDatasetValue).description}`;
                        }
                        completionItems.push(completionItem);
                    });
                }
                else {
                    return undefined;
                }

                return completionItems;
            }
        }, "=", ","
    );
    return attributeValueCompletionProvider;
}

function isEnumDatasetValue(value: any): value is EnumDatasetValue {
    return value && typeof value.description === 'string';
  }  

function searchForLinkedObject(document: vscode.TextDocument, position: vscode.Position, keys: string[]) : [Mechanic, ObjectType] | null {

    let mechanic, type = null;

    const object = getObjectLinkedToAttribute(document, position);
    if (!object) {
        return null;
    }
    if (object.startsWith('@')) {
        mechanic = getMechanicDataByName(object.replace("@", ""), ObjectType.TARGETER);
        type = ObjectType.TARGETER;
    }
    else if (object.startsWith('?')) {
        mechanic = getMechanicDataByName(object.replace("?", "").replace("!", "").replace("~", ""), ObjectType.CONDITION);
        type = ObjectType.INLINECONDITION;
    }
    else if (keyAliases.Conditions.includes(keys[0])) {
        mechanic = getMechanicDataByName(object, ObjectType.CONDITION);
        type = ObjectType.CONDITION;
    }
    else if (keyAliases.AITargetSelectors.includes(keys[0])) {
        mechanic = getMechanicDataByName(object, ObjectType.AITARGET);
        type = ObjectType.AITARGET;
    }
    else {
        mechanic = getMechanicDataByName(object, ObjectType.MECHANIC);
        type = ObjectType.MECHANIC;


        if (!mechanic && object.startsWith("skill:")) {
            mechanic = getMechanicDataByName("skill", ObjectType.MECHANIC);
        }
    }
    if (!mechanic) {
        return null;
    }

    return [mechanic, type];

}