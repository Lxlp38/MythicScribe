import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { mechanicsDataset, targetersDataset, conditionsDataset, ObjectType, ObjectInfo, ConditionActions } from '../../objectInfos';
import { getAllAttributes, getMechanicDataByName } from '../utils/mechanicutils';
import { getObjectLinkedToAttribute } from '../utils/cursorutils';
import { isEnabled } from '../utils/configutils';

export const mechanicsCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (isEnabled(document) === false) {
                return undefined;
            }

            if (context.triggerCharacter === undefined) {
                return undefined;
            }

            if(yamlutils.getParentKeys(document, position.line)[0] !== 'Skills'){
                return undefined;
            }

            let space = " ";

            if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter && context.triggerCharacter === " ") {
                const charBefore = document.getText(new vscode.Range(position.translate(0, -2), position));
                if (charBefore != '- ') {
                    return undefined;
                }
                space = "";
            }

            const keys = yamlutils.getParentKeys(document, position.line);
            const completionItems: vscode.CompletionItem[] = [];


            switch (keys[0]) {
                case 'Skills':
                    mechanicsDataset.forEach((item: any) => {
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

        }
    }, "-", " "
);

export const targeterCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if(context.triggerCharacter === undefined){
                return undefined;
            }

            if (isEnabled(document) === false) {
                return undefined;
            }

            const keys = yamlutils.getParentKeys(document, position.line);
            if (keys[0] !== 'Skills') {
                return undefined;
            }

            const completionItems: vscode.CompletionItem[] = [];

            targetersDataset.forEach((item: any) => {
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


export const inlineConditionCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (isEnabled(document) === false) {
                return undefined;
            }

            let charBefore0 = document.getText(new vscode.Range(position.translate(0, -1), position));
            if (charBefore0 === '{') {
                return undefined;
            }



            const keys = yamlutils.getParentKeys(document, position.line);
            if (keys[0] !== 'Skills') {
                return undefined;
            }


            const completionItems: vscode.CompletionItem[] = [];

            switch (context.triggerCharacter) {
                case "?":
                    let charBefore = document.getText(new vscode.Range(position.translate(0, -2), position));
                    if (charBefore !== ' ?') {
                        return undefined;
                    }

                    ["~", "~!", "!"].forEach((item: string) => {
                        let completionItem = new vscode.CompletionItem(item, vscode.CompletionItemKind.Function);
                        completionItem.kind = vscode.CompletionItemKind.Function;
                        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                        completionItem.sortText = "0";
                        completionItems.push(completionItem);
                    });
                    break;
                case "~":
                    let charBefore2 = document.getText(new vscode.Range(position.translate(0, -3), position));
                    if (charBefore2 !== " ?~") {
                        return undefined;
                    }
                    let completionItem = new vscode.CompletionItem("!", vscode.CompletionItemKind.Function);
                    completionItem.kind = vscode.CompletionItemKind.Function;
                    completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                    completionItem.sortText = "0";
                    completionItems.push(completionItem);
                    break;
                case "!":
                    let charBefore3 = document.getText(new vscode.Range(position.translate(0, -3), position));
                    if (charBefore3 !== " ?!" && charBefore3 !== "?~!") {
                        return undefined;
                    }
                    break;
            }



            conditionsDataset.forEach((item: any) => {
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
    }, "?", "!", "~"
);


function addOperatorsToConditionLine(completionItems : vscode.CompletionItem[]) {
    const completionItem1 = new vscode.CompletionItem("&&", vscode.CompletionItemKind.Function);
    completionItem1.kind = vscode.CompletionItemKind.Function;
    completionItem1.insertText = new vscode.SnippetString("&& $0");
    completionItem1.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
    const completionItem2 = new vscode.CompletionItem("||", vscode.CompletionItemKind.Function);
    completionItem2.kind = vscode.CompletionItemKind.Function;
    completionItem2.insertText = new vscode.SnippetString("|| $0");
    completionItem2.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
    completionItems.push(completionItem1);
    completionItems.push(completionItem2);

}

function addConditionActionsToConditionLine(completionItems : vscode.CompletionItem[]) {
    Object.keys(ConditionActions).forEach((key: string) => {
        let completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.Function);
        completionItem.kind = vscode.CompletionItemKind.Function;
        completionItem.insertText = new vscode.SnippetString(key + " $0");
        completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
        completionItems.push(completionItem);
    });    
}

export const conditionCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            console.log(context);

            if (isEnabled(document) === false) {
                return undefined;
            }

            // if (context.triggerCharacter === undefined) {
            //     return undefined;
            // }

            const keys = yamlutils.getParentKeys(document, position.line);
            if (!['Conditions', 'TargetConditions', 'TriggerConditions'].includes(keys[0])) {
                return undefined;
            }

            const charBefore = document.getText(new vscode.Range(position.translate(0, -2), position));
            if (charBefore[1] === "{") {
                return undefined;
            }
            console.log("|" + charBefore + "|");
            console.log(yamlutils.getWordBeforePosition(document, position));

            let space = " ";

            const completionItems: vscode.CompletionItem[] = [];
            let conditionAction = null
            const lastIsConditionAction = Object.keys(ConditionActions).includes(yamlutils.getWordBeforePosition(document, position));
            if (lastIsConditionAction) {
                conditionAction = yamlutils.getWordBeforePosition(document, position);
                addOperatorsToConditionLine(completionItems);
                return completionItems;
            }

            if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter && context.triggerCharacter === " ") {
                if (!["- ", "( ", "| ", "& "].includes(charBefore)) {
                    if ([") ", "} "].includes(charBefore)) {

                        addOperatorsToConditionLine(completionItems);

                        addConditionActionsToConditionLine(completionItems);

                        return completionItems;
                    }
                    return undefined;
                }
                space = "";
            }
            if (context.triggerKind === vscode.CompletionTriggerKind.Invoke && context.triggerCharacter === undefined) {
                space = "";
            }



            const openBraceCompletion = new vscode.CompletionItem("(", vscode.CompletionItemKind.Function);
            openBraceCompletion.kind = vscode.CompletionItemKind.Function;
            openBraceCompletion.insertText = new vscode.SnippetString(space + "( $0 )");
            openBraceCompletion.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
            completionItems.push(openBraceCompletion);

            const openBraceCount = (document.getText().match(/\(/g) || []).length;
            const closeBraceCount = (document.getText().match(/\)/g) || []).length;
            if (openBraceCount > closeBraceCount) {
                const closeBraceCompletion = new vscode.CompletionItem(")", vscode.CompletionItemKind.Function);
                closeBraceCompletion.kind = vscode.CompletionItemKind.Function;
                closeBraceCompletion.insertText = new vscode.SnippetString(") $0");
                closeBraceCompletion.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                completionItems.push(closeBraceCompletion);
            }


            conditionsDataset.forEach((item: any) => {
                item.name.forEach((name: string) => {
                    const completionItem = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
                    completionItem.detail = `${item.description}`;
                    completionItem.kind = vscode.CompletionItemKind.Function;
                    completionItem.insertText = new vscode.SnippetString(space + name + "{$0}");
                    completionItem.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
                    completionItems.push(completionItem);
                });
            });

            return completionItems;
        }
    }, "-", " ", "(", "|", "&", ")"
);

export const attributeCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'yaml',
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            if (isEnabled(document) === false) {
                return undefined;
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
                mechanic = getMechanicDataByName(object.replace("@", ""), targetersDataset);
                type = ObjectType.TARGETER;
            }
            else if (object?.startsWith('~')) {
                return null
            }
            else if (object?.startsWith('?')) {
                mechanic = getMechanicDataByName(object.replace("?", "").replace("!", "").replace("~", ""), conditionsDataset);
                type = ObjectType.INLINECONDITION;
            }
            else if (["Conditions", "TargetConditions", "TriggerConditions"].includes(keys[0])) {
                mechanic = getMechanicDataByName(object, conditionsDataset);
                type = ObjectType.CONDITION;
            }
            else {
                mechanic = getMechanicDataByName(object, mechanicsDataset);
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

            return completionItems
        }
    }, "{", ";"
);