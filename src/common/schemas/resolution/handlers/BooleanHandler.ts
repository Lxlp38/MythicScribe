import { retriggerCompletionsCommand } from '@common/constants';
import * as vscode from 'vscode';

import { SchemaTypeHandler } from '../types/SchemaTypeHandler';

export const BooleanHandler: SchemaTypeHandler = {
    provideValueCompletion: (_element, context) => {
        return ['true', 'false'].map((value) => {
            const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.EnumMember);
            item.insertText = new vscode.SnippetString(value + (context.suffix ?? ''));
            if (context.command) {
                item.command = context.command;
                item.kind = vscode.CompletionItemKind.Operator;
            }
            return item;
        });
    },
    provideStructureCompletion: (key, element, indentation) => {
        const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
        item.detail = element.description;
        // Boolean snippet with choice
        item.insertText = new vscode.SnippetString(`${indentation}${key}: \${1|true,false|}$0`);
        item.command = retriggerCompletionsCommand;
        item.kind = vscode.CompletionItemKind.Property;
        return [item];
    },
};
