import * as vscode from 'vscode';

import { MobFileObjects } from '../../schemas/mobFileObjects';
import { generateFileCompletion } from '../../utils/completionhelper';

export function mobFileCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                return generateFileCompletion(document, position, context, MobFileObjects);
            },
        },
        '\n'
    );
}
