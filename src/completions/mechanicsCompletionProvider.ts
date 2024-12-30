import * as vscode from 'vscode';

import * as yamlutils from '../utils/yamlutils';
import { Mechanic, ObjectInfo, ObjectType } from '../objectInfos';
import { listCompletion } from '../utils/completionhelper';

export function mechanicCompletionProvider(
    type: ObjectType,
    keyAliases: string[],
    defaultextend: string,
) {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext,
            ) {
                if (!keyAliases.includes(yamlutils.getParentKeys(document, position)[0])) {
                    return undefined;
                }

                const space = listCompletion(document, position, context);
                if (space === undefined) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];

                ObjectInfo[type].dataset.forEach((item: Mechanic) => {
                    item.name.forEach((name: string) => {
                        const completionItem = new vscode.CompletionItem(
                            name,
                            vscode.CompletionItemKind.Function,
                        );
                        completionItem.detail = `${item.description}`;
                        completionItem.kind = vscode.CompletionItemKind.Function;
                        if (
                            (!item.attributes || item.attributes.length === 0) &&
                            item.extends === defaultextend
                        ) {
                            completionItem.insertText = new vscode.SnippetString(space + name);
                        } else {
                            completionItem.insertText = new vscode.SnippetString(
                                space + name + '{$0}',
                            );
                        }
                        completionItem.command = {
                            command: 'editor.action.triggerSuggest',
                            title: 'Re-trigger completions...',
                        };
                        completionItems.push(completionItem);
                    });
                });
                return completionItems;
            },
        },
        '-',
        ' ',
    );
}
