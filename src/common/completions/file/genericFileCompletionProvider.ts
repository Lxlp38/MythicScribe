import * as vscode from 'vscode';
import { ConfigProvider } from '@common/providers/configProvider';
import { generateFileCompletion } from '@common/schemas/resolution/schemaResolution';

import { Schema } from '../../objectInfos';

export function genericFileCompletionProvider(schema: Schema) {
    const triggerChar =
        ConfigProvider.registry.editor.get('acceptSuggestionOnEnter') === 'off'
            ? ['\n']
            : undefined;
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                return generateFileCompletion(document, position, context, schema);
            },
        },
        ...(triggerChar ?? [])
    );
}
