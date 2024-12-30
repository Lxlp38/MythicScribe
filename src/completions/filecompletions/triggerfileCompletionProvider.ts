import * as vscode from 'vscode';

import { keyAliases, Mechanic, ObjectInfo, ObjectType, TriggerType } from '../../objectInfos';
import { checkShouldPrefixComplete } from '../../utils/completionhelper';
import * as yamlutils from '../../utils/yamlutils';

export function triggerfileCompletionProvider(
    type: TriggerType,
    parentKey: string[] = keyAliases.Skills,
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
                const keys = yamlutils.getParentKeys(document, position);
                if (!parentKey.includes(keys[0])) {
                    return undefined;
                }

                if (!checkShouldPrefixComplete(document, position, context, ['~'])) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];

                ObjectInfo[ObjectType.TRIGGER].dataset
                    .filter((item: Mechanic) => {
                        return item.implements && item.implements.includes(type.toString());
                    })
                    .forEach((item: Mechanic) => {
                        item.name.forEach((name: string) => {
                            const completionItem = new vscode.CompletionItem(
                                name,
                                vscode.CompletionItemKind.Function,
                            );
                            completionItem.detail = `${item.description}`;
                            completionItem.kind = vscode.CompletionItemKind.Function;
                            completionItem.insertText = new vscode.SnippetString(name + ' $0');
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
        '~',
    );
}
