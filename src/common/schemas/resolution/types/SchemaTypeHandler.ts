import { SchemaElement } from '@common/objectInfos';
import * as vscode from 'vscode';

import { CompletionSchemaContext } from './CompletionSchemaContext';

export interface SchemaTypeHandler {
    /**
     * Handles the completion of values (after colons or after a dash).
     */
    provideValueCompletion(
        element: SchemaElement,
        context: CompletionSchemaContext
    ): vscode.CompletionItem[] | undefined;

    /**
     * Handles structural completion (generation of keys and snippets in the next line).
     * @param keyName The name of the key we are inserting.
     * @param element The associated schema element.
     * @param indentation The current indentation.
     */
    provideStructureCompletion(
        keyName: string,
        element: SchemaElement,
        indentation: string
    ): vscode.CompletionItem[];
}
