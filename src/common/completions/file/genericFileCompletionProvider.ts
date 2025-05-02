import * as vscode from 'vscode';

import { generateFileCompletion } from '../../utils/completionhelper';
import { Schema } from '../../objectInfos';

export function genericFileCompletionProvider(schema: Schema) {
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
        '\n'
    );
}
