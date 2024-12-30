import * as vscode from 'vscode';

import { keyAliases, ObjectInfo, ObjectType } from '../objectInfos';
import { addMechanicCompletions, checkShouldComplete } from '../utils/completionhelper';

export function targeterCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext,
            ) {
                if (!checkShouldComplete(document, position, context, keyAliases.Skills, ['@'])) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];

                addMechanicCompletions(ObjectInfo[ObjectType.TARGETER].dataset, completionItems);

                return completionItems;
            },
        },
        '@',
    );
}
