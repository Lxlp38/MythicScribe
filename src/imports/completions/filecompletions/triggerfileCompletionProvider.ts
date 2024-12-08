import * as vscode from 'vscode';
import * as yamlutils from '../../utils/yamlutils';
import { keyAliases, Mechanic, ObjectInfo, ObjectType } from '../../../objectInfos';
import { checkShouldComplete } from '../../utils/completionhelper';
import { TriggerType } from '../../../objectInfos';

export function triggerfileCompletionProvider(type: TriggerType, parentKey: string[] = keyAliases["Skills"]) {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {

                const keys = yamlutils.getParentKeys(document, position);
                if (!parentKey.includes(keys[0])) {
                    return undefined;
                }

                if (!checkShouldComplete(document, position, context, ["~"])) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];

                ObjectInfo[ObjectType.TRIGGER].dataset
                    .filter((item: Mechanic) => {
                        return item.implements && item.implements.includes(type.toString());
                    })
                    .forEach((item: Mechanic) => {
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
}
