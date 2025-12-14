import { retriggerCompletionsCommand } from '@common/constants';
import { EnumSchemaElement } from '@common/objectInfos';
import * as vscode from 'vscode';

import { SchemaTypeHandler } from '../types/SchemaTypeHandler';
import { generateEnumCompletions } from '../helpers';

// --- Strategies (Handlers) ---
export const EnumHandler: SchemaTypeHandler = {
    provideValueCompletion: (element: EnumSchemaElement, context) => {
        if (!element.dataset) {
            return undefined;
        }
        return generateEnumCompletions(element.dataset, context);
    },
    provideStructureCompletion: (key, element, indentation) => {
        const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
        item.detail = element.description;
        // Snippet standard: key: value
        item.insertText = new vscode.SnippetString(`${indentation}${key}: $0`);
        item.command = retriggerCompletionsCommand;
        item.kind = vscode.CompletionItemKind.Enum;
        return [item];
    },
};
