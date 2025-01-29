import * as vscode from 'vscode';

import { generateFileCompletion } from '../../utils/completionhelper';
import { FileObjectMap } from '../../objectInfos';

export function genericFileCompletionProvider(fileobjectmap: FileObjectMap) {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                return generateFileCompletion(document, position, context, fileobjectmap);
            },
        },
        '\n'
    );
}
