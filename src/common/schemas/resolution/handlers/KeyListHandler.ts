import { retriggerCompletionsCommand } from '@common/constants';
import * as vscode from 'vscode';

import { SchemaTypeHandler } from '../types/SchemaTypeHandler';
import { DefaultHandler } from './DefaultHandler';

export const KeyListHandler: SchemaTypeHandler = {
    provideValueCompletion: (element, context) => {
        return DefaultHandler.provideValueCompletion(element, context);
    },
    provideStructureCompletion: (key, element, indentation) => {
        const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Property);
        item.detail = element.description;
        item.insertText = new vscode.SnippetString(
            `${indentation}${key}:\n${indentation}  $1: $2$0`
        );
        item.command = retriggerCompletionsCommand;
        item.kind = vscode.CompletionItemKind.Property;
        return [item];
    },
};
