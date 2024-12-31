import * as vscode from 'vscode';

import { ObjectInfo, ObjectType, keyAliases } from '../objectInfos';
import { addMechanicCompletions, checkShouldComplete } from '../utils/completionhelper';

export function inlineConditionCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext,
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

                const charBefore0 = document.getText(
                    new vscode.Range(position.translate(0, -1), position),
                );
                switch (charBefore0) {
                    case '?': {
                        const charBefore1 = document.getText(
                            new vscode.Range(position.translate(0, -2), position),
                        );
                        if (charBefore1 !== ' ?') {
                            return undefined;
                        }

                        ['~', '~!', '!'].forEach((item: string) => {
                            const completionItem = new vscode.CompletionItem(
                                item,
                                vscode.CompletionItemKind.Function,
                            );
                            completionItem.kind = vscode.CompletionItemKind.Function;
                            completionItem.command = {
                                command: 'editor.action.triggerSuggest',
                                title: 'Re-trigger completions...',
                            };
                            completionItem.sortText = '0';
                            completionItems.push(completionItem);
                        });
                        break;
                    }
                    case '~': {
                        const charBefore2 = document.getText(
                            new vscode.Range(position.translate(0, -3), position),
                        );
                        if (charBefore2 !== ' ?~') {
                            return undefined;
                        }
                        const completionItem = new vscode.CompletionItem(
                            '!',
                            vscode.CompletionItemKind.Function,
                        );
                        completionItem.kind = vscode.CompletionItemKind.Function;
                        completionItem.command = {
                            command: 'editor.action.triggerSuggest',
                            title: 'Re-trigger completions...',
                        };
                        completionItem.sortText = '0';
                        completionItems.push(completionItem);
                        break;
                    }
                    case '!': {
                        const charBefore3 = document.getText(
                            new vscode.Range(position.translate(0, -3), position),
                        );
                        if (charBefore3 !== ' ?!' && charBefore3 !== '?~!') {
                            return undefined;
                        }
                        break;
                    }
                }

                addMechanicCompletions(ObjectInfo[ObjectType.CONDITION].dataset, completionItems);

                return completionItems;
            },
        },
        '?',
        '!',
        '~',
    );
}