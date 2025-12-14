import { EntrySchemaElement, SchemaElement } from '@common/objectInfos';
import * as vscode from 'vscode';
import { retriggerCompletionsCommand } from '@common/constants';

import { SchemaTypeHandler } from '../types/SchemaTypeHandler';
import { CompletionSchemaContext } from '../types/CompletionSchemaContext';

export class EntryListHandlerImpl implements SchemaTypeHandler {
    private handleEntryListLogic: (
        element: EntrySchemaElement,
        context: CompletionSchemaContext
    ) => vscode.CompletionItem[] | undefined;

    constructor({
        handleEntryListLogic,
    }: {
        handleEntryListLogic: (
            element: EntrySchemaElement,
            context: CompletionSchemaContext
        ) => vscode.CompletionItem[] | undefined;
    }) {
        this.handleEntryListLogic = handleEntryListLogic;
    }

    provideValueCompletion(element: SchemaElement, context: CompletionSchemaContext) {
        if (!('entries' in element)) {
            return undefined;
        }
        return this.handleEntryListLogic(element as EntrySchemaElement, context);
    }

    provideStructureCompletion(key: string, element: SchemaElement, indentation: string) {
        const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
        item.command = retriggerCompletionsCommand;
        item.detail = element.description;
        item.insertText = new vscode.SnippetString(`${indentation}${key}: $0`);
        item.kind = vscode.CompletionItemKind.Snippet;
        return [item];
    }
}
