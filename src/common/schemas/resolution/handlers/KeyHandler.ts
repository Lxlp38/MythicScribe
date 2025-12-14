import { retriggerCompletionsCommand } from '@common/constants';
import * as vscode from 'vscode';

import { SchemaTypeHandler } from '../types/SchemaTypeHandler';
import { DefaultHandler } from './DefaultHandler';

export const KeyHandler: SchemaTypeHandler = {
    provideValueCompletion: (element, context) => {
        if (element.values) {
            return DefaultHandler.provideValueCompletion(element, context);
        }
        return undefined;
    },
    provideStructureCompletion: (key, element, indentation) => {
        const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
        item.detail = element.description;
        // Nested key snippet: indented newline
        item.insertText = new vscode.SnippetString(`${indentation}${key}:\n${indentation}  $0`);
        item.command = retriggerCompletionsCommand;
        item.kind = vscode.CompletionItemKind.Property;
        return [item];
    },
};
