import * as vscode from 'vscode';

import { keyAliases, TriggerType } from '../../objectInfos';
import { MythicMechanic, ScribeMechanicHandler } from '../../datasets/ScribeMechanic';
import {
    checkShouldPrefixComplete,
    retriggerCompletionsCommand,
} from '../../utils/completionhelper';
import * as yamlutils from '../../utils/yamlutils';

export function triggerfileCompletionProvider(
    type: TriggerType,
    parentKey: string[] = keyAliases.Skills
) {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                const keys = yamlutils.getParentKeys(document, position);
                if (!parentKey.includes(keys[0].key)) {
                    return undefined;
                }

                if (!checkShouldPrefixComplete(document, position, context, ['~'])) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];

                ScribeMechanicHandler.registry.trigger
                    .getMechanics()
                    .filter((item: MythicMechanic) => {
                        return item.implements && item.implements.includes(type.toString());
                    })
                    .forEach((item: MythicMechanic) => {
                        item.name.forEach((name: string) => {
                            const completionItem = new vscode.CompletionItem(
                                name,
                                vscode.CompletionItemKind.Function
                            );
                            completionItem.detail = `${item.description}`;
                            completionItem.kind = vscode.CompletionItemKind.Function;
                            completionItem.insertText = new vscode.SnippetString(name + ' $0');
                            completionItem.command = retriggerCompletionsCommand;
                            completionItems.push(completionItem);
                        });
                    });
                return completionItems;
            },
        },
        '~'
    );
}
