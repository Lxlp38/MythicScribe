import { retriggerCompletionsCommand } from '@common/constants';
import { ListSchemaElement, EntrySchemaElement } from '@common/objectInfos';
import * as vscode from 'vscode';

import { SchemaTypeHandler } from '../types/SchemaTypeHandler';
import { getListCompletionNeededSpaces, generateEnumCompletions } from '../helpers';
import { CompletionSchemaContext } from '../types/CompletionSchemaContext';

function provideObjectEntryCompletions(
    element: ListSchemaElement
): vscode.CompletionItem[] | undefined {
    if (!element.keys || typeof element.keys === 'function') {
        return undefined;
    }

    return Object.entries(element.keys)
        .filter(([key]) => !key.startsWith('*'))
        .map(([key, child]) => {
            const completion = new vscode.CompletionItem(key, vscode.CompletionItemKind.Property);
            completion.detail = child.description;
            switch (child.type) {
                case 'key':
                    completion.insertText = new vscode.SnippetString(`${key}:\n  $0`);
                    break;
                case 'list':
                    completion.insertText = new vscode.SnippetString(`${key}:\n- $0`);
                    break;
                default:
                    completion.insertText = new vscode.SnippetString(`${key}: $0`);
            }
            completion.command = retriggerCompletionsCommand;
            return completion;
        });
}

function provideStaticValueCompletions(
    values: string[],
    context: CompletionSchemaContext,
    prefix: string
): vscode.CompletionItem[] {
    return values.map((value, index) => {
        const completion = new vscode.CompletionItem(value, vscode.CompletionItemKind.EnumMember);
        completion.sortText = index.toString().padStart(4, '0');
        completion.insertText = new vscode.SnippetString(prefix + value + (context.suffix ?? ''));
        if (context.command) {
            completion.command = context.command;
        }
        return completion;
    });
}

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

        const objectEntries = provideObjectEntryCompletions(element);
        if (objectEntries) {
            return objectEntries;
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

        if (element.values) {
            const space = getListCompletionNeededSpaces(document, position, ctx);
            if (space === undefined) {
                return undefined;
            }
            return provideStaticValueCompletions(element.values, context, space);
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
