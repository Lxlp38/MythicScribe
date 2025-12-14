import { getScribeEnumHandler } from '@common/datasets/ScribeEnum';
import { ArrayKeySchemaElement, SchemaElement } from '@common/objectInfos';
import * as vscode from 'vscode';
import { EnumDatasetValue } from '@common/datasets/types/Enum';
import {
    previousSymbol,
    PreviousSymbolRegexes,
    isAfterComment,
    getParentKeys,
} from '@common/utils/yamlutils';

import { CompletionSchemaContext } from './types/CompletionSchemaContext';

// --- Helper Functions (Hoisted) ---

export function generateEnumCompletions(
    datasetName: string,
    context: CompletionSchemaContext,
    prefix: string = ''
): vscode.CompletionItem[] | undefined {
    const dataset = getScribeEnumHandler().getEnum(datasetName);
    if (!dataset) {
        return undefined;
    }

    const items: vscode.CompletionItem[] = [];
    dataset.getDataset().forEach((item, value) => {
        const completionItem = getEnumCompletion(item, value);
        // Adds space/prefix if necessary
        const insertText = prefix + value + (context.suffix ?? '');
        completionItem.insertText = new vscode.SnippetString(insertText);

        if (context.command) {
            completionItem.command = context.command;
            completionItem.kind = vscode.CompletionItemKind.EnumMember;
        }
        items.push(completionItem);
    });
    return items;
}

export function handleArrayKeySchemaKey(element: SchemaElement) {
    const iterableMapping: Array<{ key: string; element: SchemaElement }> = [];
    const newMapping = (element as ArrayKeySchemaElement).possibleKeyValues();
    newMapping.forEach((newElement, enumKey) => {
        iterableMapping.push({
            key: enumKey,
            element: { ...element, description: newElement.description },
        });
    });
    return iterableMapping;
}

export function getEnumCompletion(item: EnumDatasetValue, value: string) {
    const completionItem = new vscode.CompletionItem(value, vscode.CompletionItemKind.Enum);
    completionItem.detail = item.description;
    return completionItem;
}

export function getCharBefore(
    document: vscode.TextDocument,
    position: vscode.Position,
    offset: number
): string {
    if (position.character < offset) {
        return '';
    }
    return document.getText(new vscode.Range(position.translate(0, -offset), position));
}

export function getListCompletionNeededSpaces(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext
): string | undefined {
    const line = document.lineAt(position.line).text;
    if (line.match(/^\s*-\s*\S+\s/gm)) {
        return undefined;
    }

    if (context.triggerCharacter === undefined) {
        const specialSymbol = previousSymbol(PreviousSymbolRegexes.nonspace, document, position);
        if (specialSymbol !== '-') {
            return undefined;
        }
        const charBefore = getCharBefore(document, position, 1);
        if (charBefore === '-') {
            return ' ';
        } else {
            return '';
        }
    } else {
        const charBefore2 = getCharBefore(document, position, 2);
        if (charBefore2 !== '- ') {
            return undefined;
        }
    }

    if (
        context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter &&
        context.triggerCharacter === ' '
    ) {
        return '';
    }

    return ' ';
}

export function checkShouldComplete(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    keylist: string[],
    symbol: string[]
) {
    return (
        !isAfterComment(document, position) &&
        checkShouldKeyCompleteExec(document, position, keylist) &&
        checkShouldPrefixCompleteExec(document, position, context, symbol)
    );
}

export function checkShouldKeyComplete(
    document: vscode.TextDocument,
    position: vscode.Position,
    keylist: string[]
) {
    if (isAfterComment(document, position)) {
        return false;
    }
    return checkShouldKeyCompleteExec(document, position, keylist);
}
function checkShouldKeyCompleteExec(
    document: vscode.TextDocument,
    position: vscode.Position,
    keylist: string[]
) {
    const keys = getParentKeys(document, position);
    if (keys.length === 0) {
        return false;
    }
    if (!keylist.includes(keys[0].key)) {
        return false;
    }
    return true;
}

export function checkShouldPrefixComplete(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    symbol: string[],
    depth = 0
) {
    if (isAfterComment(document, position)) {
        return false;
    }
    return checkShouldPrefixCompleteExec(document, position, context, symbol, depth);
}
export function checkShouldPrefixCompleteExec(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext,
    symbol: string[],
    depth = 0
): boolean {
    if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
        const mypreviousSpecialSymbol = previousSymbol(
            PreviousSymbolRegexes.default,
            document,
            position,
            depth
        );
        if (symbol.includes(mypreviousSpecialSymbol)) {
            return true;
        }
        return false;
    }

    const charBefore = getCharBefore(document, position, 1);
    if (symbol.includes(charBefore)) {
        return true;
    }
    return false;
}
