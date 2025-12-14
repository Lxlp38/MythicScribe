import { retriggerCompletionsCommand } from '@common/constants';
import * as vscode from 'vscode';

import { SchemaTypeHandler } from '../types/SchemaTypeHandler';

export const DefaultHandler: SchemaTypeHandler = {
    provideValueCompletion: (element, context) => {
        // Fallback: provide values if they exist (array of static strings)
        if (element.values) {
            const completionItems: vscode.CompletionItem[] = [];
            element.values.forEach((value, index) => {
                const completionItem = new vscode.CompletionItem(
                    value,
                    vscode.CompletionItemKind.EnumMember
                );
                completionItem.sortText = index.toString().padStart(4, '0');
                completionItem.insertText = new vscode.SnippetString(
                    value + (context.suffix ?? '')
                );
                if (context.command) {
                    completionItem.command = context.command;
                }
                completionItems.push(completionItem);
            });
            return completionItems;
        }
        return undefined;
    },
    provideStructureCompletion: (key, element, indentation) => {
        const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
        item.detail = element.description;
        item.insertText = new vscode.SnippetString(`${indentation}${key}: $0`);
        item.command = retriggerCompletionsCommand;
        return [item];
    },
};
