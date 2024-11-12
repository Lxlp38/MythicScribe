import * as vscode from 'vscode';
import * as yamlutils from '../../utils/yamlutils';
import { keyAliases, Mechanic, ObjectInfo, ObjectType } from '../../../objectInfos';
import { checkShouldComplete } from '../../utils/completionhelper';

export function triggerfileCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {

                const keys = yamlutils.getParentKeys(document, position);
                if (!keyAliases["Skills"].includes(keys[0])) {
                    return undefined;
                }

                if (!checkShouldComplete(document, position, context, ["~"])) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];

                ObjectInfo[ObjectType.TRIGGER].dataset.forEach((item: Mechanic) => {
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
