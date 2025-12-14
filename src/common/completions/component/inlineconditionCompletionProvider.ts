import * as vscode from 'vscode';
import { keyAliases } from '@common/objectInfos';
import { retriggerCompletionsCommand } from '@common/constants';
import { ScribeMechanicHandler } from '@common/datasets/ScribeMechanic';
import { checkShouldComplete, getCharBefore } from '@common/schemas/resolution/helpers';

export function inlineConditionCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                if (
                    !checkShouldComplete(document, position, context, keyAliases.Skills, [
                        '?',
                        '!',
                        '~',
                    ])
                ) {
                    return undefined;
                }
                const completionItems: vscode.CompletionItem[] = [];

                const charBefore0 = getCharBefore(document, position, 1);
                switch (charBefore0) {
                    case '?': {
                        const charBefore1 = getCharBefore(document, position, 2);
                        if (charBefore1 !== ' ?') {
                            return undefined;
                        }

                        ['~', '~!', '!'].forEach((item: string) => {
                            const completionItem = new vscode.CompletionItem(
                                item,
                                vscode.CompletionItemKind.Function
                            );
                            completionItem.kind = vscode.CompletionItemKind.Function;
                            completionItem.command = retriggerCompletionsCommand;
                            completionItem.sortText = '0';
                            completionItems.push(completionItem);
                        });
                        break;
                    }
                    case '~': {
                        const charBefore2 = getCharBefore(document, position, 3);
                        if (charBefore2 !== ' ?~') {
                            return undefined;
                        }
                        const completionItem = new vscode.CompletionItem(
                            '!',
                            vscode.CompletionItemKind.Function
                        );
                        completionItem.kind = vscode.CompletionItemKind.Function;
                        completionItem.command = retriggerCompletionsCommand;
                        completionItem.sortText = '0';
                        completionItems.push(completionItem);
                        break;
                    }
                    case '!': {
                        const charBefore3 = getCharBefore(document, position, 3);
                        if (charBefore3 !== ' ?!' && charBefore3 !== '?~!') {
                            return undefined;
                        }
                        break;
                    }
                }

                completionItems.push(
                    ...ScribeMechanicHandler.registry.condition.mechanicCompletions
                );

                return completionItems;
            },
        },
        '?',
        '!',
        '~'
    );
}
