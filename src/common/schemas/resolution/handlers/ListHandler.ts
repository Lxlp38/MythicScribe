import { retriggerCompletionsCommand } from '@common/constants';
import { ListSchemaElement, EntrySchemaElement } from '@common/objectInfos';
import * as vscode from 'vscode';

import { SchemaTypeHandler } from '../types/SchemaTypeHandler';
import { getListCompletionNeededSpaces, generateEnumCompletions } from '../helpers';
import { CompletionSchemaContext } from '../types/CompletionSchemaContext';

export class ListHandlerImpl implements SchemaTypeHandler {
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

    provideValueCompletion(element: ListSchemaElement, context: CompletionSchemaContext) {
        const { document, position, context: ctx } = context;
        if (!document || !position || !ctx) {
            return undefined;
        }

        if (element.dataset) {
            const space = getListCompletionNeededSpaces(document, position, ctx);
            if (space === undefined) {
                return undefined;
            }

            const items = generateEnumCompletions(element.dataset, context, space);

            if (items && element.values) {
                items.forEach((i) => {
                    if (i.insertText instanceof vscode.SnippetString) {
                        i.insertText.appendText(' ').appendChoice(element.values!);
                    }
                });
            }
            return items;
        }

        if (element.entries && element.entries.length > 0) {
            return this.handleEntryListLogic(element as EntrySchemaElement, context);
        }

        return undefined;
    }

    provideStructureCompletion(key: string, element: ListSchemaElement, indentation: string) {
        const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
        item.detail = element.description;
        item.insertText = new vscode.SnippetString(`${indentation}${key}:\n${indentation}- $0`);
        item.command = retriggerCompletionsCommand;
        item.kind = vscode.CompletionItemKind.Property;
        return [item];
    }
}
