import * as vscode from 'vscode';

import { keyAliases } from '../objectInfos';
import { addMechanicCompletions, checkShouldComplete } from '../utils/completionhelper';
import { ScribeMechanicHandler } from '../datasets/ScribeMechanic';

export function targeterCompletionProvider() {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                if (!checkShouldComplete(document, position, context, keyAliases.Skills, ['@'])) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];

                addMechanicCompletions(
                    ScribeMechanicHandler.registry.targeter.getMechanics(),
                    completionItems
                );

                return completionItems;
            },
        },
        '@'
    );
}
