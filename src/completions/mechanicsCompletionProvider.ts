import * as vscode from 'vscode';

import { MythicMechanic, AbstractScribeMechanicRegistry } from '../datasets/ScribeMechanic';
import {
    checkShouldKeyComplete,
    getListCompletionNeededSpaces,
    retriggerCompletionsCommand,
} from '../utils/completionhelper';

export function mechanicCompletionProvider(
    registry: AbstractScribeMechanicRegistry,
    keyAliases: string[],
    defaultextend: string
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
                if (!checkShouldKeyComplete(document, position, keyAliases)) {
                    return undefined;
                }

                const space = getListCompletionNeededSpaces(document, position, context);
                if (space === undefined) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];
                registry.getMechanics().forEach((item: MythicMechanic) => {
                    item.name.forEach((name: string) => {
                        const completionItem = new vscode.CompletionItem(
                            name,
                            vscode.CompletionItemKind.Function
                        );
                        completionItem.detail = `${item.description}`;
                        completionItem.kind = vscode.CompletionItemKind.Function;
                        if (
                            (!item.getAttributes() || item.getAttributes().length === 0) &&
                            item.extends === defaultextend
                        ) {
                            completionItem.insertText = new vscode.SnippetString(space + name);
                        } else {
                            completionItem.insertText = new vscode.SnippetString(
                                space + name + '{$0}'
                            );
                            completionItem.command = retriggerCompletionsCommand;
                        }
                        completionItems.push(completionItem);
                    });
                });
                return completionItems;
            },
        },
        '-',
        ' '
    );
}
