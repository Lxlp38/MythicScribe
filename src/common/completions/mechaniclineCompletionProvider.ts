import * as vscode from 'vscode';

import * as yamlutils from '../utils/yamlutils';
import { ActiveFileTypeInfo } from '../subscriptions/SubscriptionHelper';
import { getMechanicLine } from '../utils/yamlutils';
import { keyAliases } from '../objectInfos';
import { retriggerCompletionsCommand } from '../utils/completionhelper';

export function mechaniclineCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                if (yamlutils.isAfterComment(document, position)) {
                    return undefined;
                }

                const previusSpecialSymbol = yamlutils.previousSymbol(
                    yamlutils.PreviousSymbolRegexes.default,
                    document,
                    position
                );
                if (['{', ';', '='].includes(previusSpecialSymbol)) {
                    return undefined;
                }

                const keys = yamlutils.getParentKeys(document, position);
                if (!keyAliases.Skills.includes(keys[0][0])) {
                    return undefined;
                }

                const charBefore = document.getText(
                    new vscode.Range(position.translate(0, -1), position)
                );
                if (charBefore !== ' ') {
                    return undefined;
                }

                const mechanicLine = getMechanicLine(document, position.line);
                if (mechanicLine.size === 0) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];

                const completionItem = new vscode.CompletionItem(
                    '?',
                    vscode.CompletionItemKind.Function
                );
                completionItem.detail = 'Add a condition to the mechanic line';
                completionItem.kind = vscode.CompletionItemKind.Function;
                completionItem.command = retriggerCompletionsCommand;
                completionItems.push(completionItem);

                if (mechanicLine.has('condition')) {
                    return completionItems;
                }

                if (!mechanicLine.has('targeter')) {
                    const completionItem = new vscode.CompletionItem(
                        '@',
                        vscode.CompletionItemKind.Function
                    );
                    completionItem.detail = 'Add a targeter to the mechanic line';
                    completionItem.kind = vscode.CompletionItemKind.Function;
                    completionItem.command = retriggerCompletionsCommand;
                    completionItems.push(completionItem);
                }

                if (!mechanicLine.has('trigger') && !ActiveFileTypeInfo.metaskill) {
                    const completionItem = new vscode.CompletionItem(
                        '~',
                        vscode.CompletionItemKind.Function
                    );
                    completionItem.detail = 'Add a trigger to the mechanic line';
                    completionItem.kind = vscode.CompletionItemKind.Function;
                    completionItem.command = retriggerCompletionsCommand;
                    completionItems.push(completionItem);
                }

                return completionItems;
            },
        },
        ' '
    );
}
