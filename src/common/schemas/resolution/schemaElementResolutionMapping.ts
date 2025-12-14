import * as vscode from 'vscode';
import { EntrySchemaElement, SchemaElementTypes } from '@common/objectInfos';
import { retriggerCompletionsCommand } from '@common/constants';

import { BooleanHandler } from './handlers/BooleanHandler';
import { EnumHandler } from './handlers/EnumHandler';
import { KeyHandler } from './handlers/KeyHandler';
import { KeyListHandler } from './handlers/KeyListHandler';
import { ListHandlerImpl } from './handlers/ListHandler';
import { SchemaTypeHandler } from './types/SchemaTypeHandler';
import { DefaultHandler } from './handlers/DefaultHandler';
import { EntryListHandlerImpl } from './handlers/EntryListHandler';
import { CompletionSchemaContext } from './types/CompletionSchemaContext';

// --- Registry ---
export const schemaElementResolutionMapping: Record<string, SchemaTypeHandler> = {
    [SchemaElementTypes.ENUM]: EnumHandler,
    [SchemaElementTypes.BOOLEAN]: BooleanHandler,
    [SchemaElementTypes.LIST]: new ListHandlerImpl({ handleEntryListLogic }),
    [SchemaElementTypes.ENTRY_LIST]: new EntryListHandlerImpl({ handleEntryListLogic }),
    [SchemaElementTypes.KEY]: KeyHandler,
    [SchemaElementTypes.KEY_LIST]: KeyListHandler,
};

export function getHandlerForElement(type?: string): SchemaTypeHandler {
    if (!type) {
        return DefaultHandler;
    }
    return schemaElementResolutionMapping[type] || DefaultHandler;
}

/**
 * Gestisce la logica complessa delle liste posizionali (Entry List).
 * Determina in quale "slot" della lista si trova l'utente e delega al gestore di quel tipo.
 */
/**
 * Handles the complex logic of positional lists (Entry List).
 * It determines in which "slot" of the list the user is located and delegates to the handler of that type.
 */
export function handleEntryListLogic(
    object: EntrySchemaElement,
    context: CompletionSchemaContext
): vscode.CompletionItem[] | undefined {
    if (
        object.entries === undefined ||
        context.document === undefined ||
        context.position === undefined ||
        context.textExtractor === undefined
    ) {
        return undefined;
    }
    const substringOnLineBeforePosition = context.document
        .lineAt(context.position.line)
        .text.substring(0, context.position.character);

    // Calculates the index of the entry based on spaces
    const entryIndex = Math.max(
        context
            .textExtractor(substringOnLineBeforePosition)
            .replace(/{.*?}/g, '')
            .trimStart()
            .split(' ')
            .filter((v) => v !== '').length,
        0
    );

    const neededEntry = object.entries[entryIndex];
    const hasNext = object.entries.length > entryIndex + 1;

    if (neededEntry) {
        // RECURSION: Calls the handling system for the specific type found
        const handler = getHandlerForElement(neededEntry.type);
        return handler.provideValueCompletion(neededEntry, {
            ...context,
            suffix: hasNext ? ' ' : '',
            command: hasNext ? retriggerCompletionsCommand : undefined,
        });
    }
    return undefined;
}
